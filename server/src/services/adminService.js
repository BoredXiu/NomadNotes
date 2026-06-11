import AuditLog from "../models/AuditLog.js";
import AdminOperationLog from "../models/AdminOperationLog.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
import Note from "../models/Note.js";
import { AppError } from "../utils/AppError.js";
import { Op } from "sequelize";

/**
 * 管理员综合服务
 * 处理审核管理 + 用户管理 + 旅程管理 + 操作日志
 */

// ===================== 审核服务 =====================

/**
 * 提交旅程公开审核申请
 */
async function submitAudit(tripId, userId) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权操作该旅程", 403);
	}

	// 检查是否已有待审核的记录
	const existing = await AuditLog.findOne({
		where: { tripId, status: "pending" },
	});
	if (existing) {
		throw new AppError("该旅程已有待审核的公开申请，请勿重复提交", 409);
	}

	const auditLog = await AuditLog.create({
		tripId,
		userId,
		status: "pending",
	});

	return auditLog;
}

/**
 * 获取审核列表
 */
async function getAuditList({ status, page = 1, pageSize = 10, sort = "desc" }) {
	const where = {};
	if (status && ["pending", "approved", "rejected"].includes(status)) {
		where.status = status;
	}

	const offset = (page - 1) * pageSize;
	const { count, rows } = await AuditLog.findAndCountAll({
		where,
		order: [["createdAt", sort === "asc" ? "ASC" : "DESC"]],
		limit: parseInt(pageSize, 10),
		offset,
		include: [
			{
				model: Trip,
				attributes: ["id", "title", "destination", "coverImage", "isPublic"],
			},
			{
				model: User,
				attributes: ["id", "username", "avatarUrl", "isDisabled"],
			},
		],
	});

	return {
		list: rows,
		total: count,
		page: parseInt(page, 10),
		pageSize: parseInt(pageSize, 10),
	};
}

/**
 * 审批通过
 */
async function approveAudit(auditId, adminId, adminName) {
	const auditLog = await AuditLog.findByPk(auditId);
	if (!auditLog) {
		throw new AppError("审核记录不存在", 404);
	}
	if (auditLog.status !== "pending") {
		throw new AppError("该审核记录已处理", 409);
	}

	await Trip.update({ isPublic: 1 }, { where: { id: auditLog.tripId } });

	await auditLog.update({
		status: "approved",
		reviewedBy: adminId,
		reviewedByName: adminName,
		reviewedAt: new Date(),
		reason: null,
	});

	return auditLog;
}

/**
 * 驳回审核
 */
async function rejectAudit(auditId, adminId, adminName, reason) {
	const auditLog = await AuditLog.findByPk(auditId);
	if (!auditLog) {
		throw new AppError("审核记录不存在", 404);
	}
	if (auditLog.status !== "pending") {
		throw new AppError("该审核记录已处理", 409);
	}

	await auditLog.update({
		status: "rejected",
		reviewedBy: adminId,
		reviewedByName: adminName,
		reviewedAt: new Date(),
		reason: reason || "未提供驳回理由",
	});

	return auditLog;
}

/**
 * 获取待审核数量
 */
async function getPendingCount() {
	return await AuditLog.count({ where: { status: "pending" } });
}

// ===================== 用户管理服务 =====================

/**
 * 获取用户列表（分页）
 */
async function getUserList({ page = 1, pageSize = 20, keyword, sort = "desc" }) {
	const where = {};
	if (keyword) {
		where[Op.or] = [{ username: { [Op.like]: `%${keyword}%` } }, { email: { [Op.like]: `%${keyword}%` } }];
	}

	const offset = (page - 1) * pageSize;
	const { count, rows } = await User.findAndCountAll({
		where,
		attributes: { exclude: ["passwordHash"] },
		order: [["createdAt", sort === "asc" ? "ASC" : "DESC"]],
		limit: parseInt(pageSize, 10),
		offset,
	});

	return {
		list: rows,
		total: count,
		page: parseInt(page, 10),
		pageSize: parseInt(pageSize, 10),
	};
}

/**
 * 切换用户禁用/启用状态
 * 返回 { user, operationLog }
 */
async function toggleUserStatus(userId, adminId, adminName) {
	// 禁止管理员禁用自己
	if (userId === adminId) {
		throw new AppError("不能禁用或启用自己的账号", 400);
	}

	const user = await User.findByPk(userId, { attributes: { exclude: ["passwordHash"] } });
	if (!user) {
		throw new AppError("用户不存在", 404);
	}
	// 禁止操作其他管理员
	if (user.role === "admin") {
		throw new AppError("不能操作其他管理员账号", 403);
	}

	const beforeStatus = user.isDisabled;
	const newStatus = beforeStatus === 1 ? 0 : 1;
	const operationType = newStatus === 1 ? "user_disable" : "user_enable";

	await user.update({ isDisabled: newStatus });

	// 记录操作日志
	const operationLog = await AdminOperationLog.create({
		adminId,
		adminName,
		operationType,
		description: newStatus === 1 ? `禁用用户"${user.username}"（${user.email}）` : `启用用户"${user.username}"（${user.email}）`,
		targetType: "user",
		targetId: user.id,
		targetName: user.username,
		beforeSnapshot: JSON.stringify({ isDisabled: beforeStatus }),
		afterSnapshot: JSON.stringify({ isDisabled: newStatus }),
	});

	return {
		user: user.toJSON(),
		operationLog,
	};
}

// ===================== 旅程管理服务 =====================

/**
 * 获取全部旅程列表（管理员视角，含所有旅程）
 */
async function getAdminTripList({ page = 1, pageSize = 10, isPublic, isEnded, keyword, sort = "desc" }) {
	const where = {};
	if (isPublic !== undefined && isPublic !== "") {
		where.isPublic = isPublic;
	}
	if (isEnded !== undefined && isEnded !== "") {
		where.isEnded = isEnded;
	}
	if (keyword) {
		where[Op.or] = [{ title: { [Op.like]: `%${keyword}%` } }, { destination: { [Op.like]: `%${keyword}%` } }];
	}

	const offset = (page - 1) * pageSize;
	const { count, rows } = await Trip.findAndCountAll({
		where,
		order: [["createdAt", sort === "asc" ? "ASC" : "DESC"]],
		limit: parseInt(pageSize, 10),
		offset,
		include: [
			{
				model: User,
				attributes: ["id", "username", "avatarUrl", "isDisabled"],
			},
		],
	});

	return {
		list: rows,
		total: count,
		page: parseInt(page, 10),
		pageSize: parseInt(pageSize, 10),
	};
}

/**
 * 下架/恢复旅程（切换 isPublic 状态）
 */
async function takedownTrip(tripId, adminId, adminName) {
	const trip = await Trip.findByPk(tripId, {
		include: [{ model: User, attributes: ["username"] }],
	});
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}

	const beforeStatus = trip.isPublic;
	const newStatus = beforeStatus === 1 ? 0 : 1;
	const operationType = newStatus === 0 ? "trip_takedown" : "trip_restore";

	await trip.update({ isPublic: newStatus });

	// 记录操作日志
	const operationLog = await AdminOperationLog.create({
		adminId,
		adminName,
		operationType,
		description: newStatus === 0 ? `下架旅程"${trip.title}"（${trip.destination}）` : `恢复旅程"${trip.title}"（${trip.destination}）`,
		targetType: "trip",
		targetId: trip.id,
		targetName: trip.title,
		beforeSnapshot: JSON.stringify({ isPublic: beforeStatus }),
		afterSnapshot: JSON.stringify({ isPublic: newStatus }),
	});

	return {
		trip: trip.toJSON(),
		operationLog,
	};
}

/**
 * 强制删除旅程（含游记、账单、审核记录）
 */
async function forceDeleteTrip(tripId, adminId, adminName) {
	const trip = await Trip.findByPk(tripId, {
		include: [{ model: User, attributes: ["username"] }],
	});
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}

	// 级联删除：先删子记录再删父记录
	await Note.destroy({ where: { tripId } });
	await Expense.destroy({ where: { tripId } });
	await AuditLog.destroy({ where: { tripId } });
	await trip.destroy();

	// 记录操作日志
	const operationLog = await AdminOperationLog.create({
		adminId,
		adminName,
		operationType: "trip_delete",
		description: `删除旅程"${trip.title}"（${trip.destination}），级联删除其游记、账单及审核记录`,
		targetType: "trip",
		targetId: trip.id,
		targetName: trip.title,
		beforeSnapshot: JSON.stringify({
			title: trip.title,
			destination: trip.destination,
			isPublic: trip.isPublic,
		}),
		afterSnapshot: null,
	});

	return { operationLog };
}

/**
 * 删除旅程中的游记
 */
async function deleteTripNote(tripId, noteId, adminId, adminName) {
	const trip = await Trip.findByPk(tripId);
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}

	const note = await Note.findOne({ where: { id: noteId, tripId } });
	if (!note) {
		throw new AppError("游记不存在", 404);
	}

	await note.destroy();

	// 记录操作日志
	const noteExcerpt = note.content ? note.content.substring(0, 50) : "(无内容)";
	const operationLog = await AdminOperationLog.create({
		adminId,
		adminName,
		operationType: "note_delete",
		description: `删除旅程"${trip.title}"中的游记：${noteExcerpt}`,
		targetType: "note",
		targetId: note.id,
		targetName: noteExcerpt,
		beforeSnapshot: JSON.stringify({
			noteId: note.id,
			content: noteExcerpt,
		}),
		afterSnapshot: null,
	});

	return { operationLog };
}

// ===================== 操作日志服务 =====================

/**
 * 获取操作日志列表
 */
async function getOperationLogs({ page = 1, pageSize = 20, operationType, sort = "desc" }) {
	const where = {};
	if (operationType) {
		where.operationType = operationType;
	}

	const offset = (page - 1) * pageSize;
	const { count, rows } = await AdminOperationLog.findAndCountAll({
		where,
		order: [["createdAt", sort === "asc" ? "ASC" : "DESC"]],
		limit: parseInt(pageSize, 10),
		offset,
	});

	return {
		list: rows,
		total: count,
		page: parseInt(page, 10),
		pageSize: parseInt(pageSize, 10),
	};
}

export {
	submitAudit,
	getAuditList,
	approveAudit,
	rejectAudit,
	getPendingCount,
	getUserList,
	toggleUserStatus,
	getAdminTripList,
	takedownTrip,
	forceDeleteTrip,
	deleteTripNote,
	getOperationLogs,
};
