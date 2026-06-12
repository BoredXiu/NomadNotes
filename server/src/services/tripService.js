import Trip from "../models/Trip.js";
import Expense from "../models/Expense.js";
import Note from "../models/Note.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { Op } from "sequelize";
import fs from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createTrip({ userId, title, destination, startDate, endDate, coverImage, isPublic }) {
	const trip = await Trip.create({
		userId,
		title,
		destination,
		startDate,
		endDate,
		coverImage: coverImage || null,
		isPublic: isPublic ? 1 : 0,
	});
	return trip;
}

async function getUserTrips(userId, { page = 1, pageSize = 10, sort = "desc" }) {
	const offset = (page - 1) * pageSize;
	const { count, rows } = await Trip.findAndCountAll({
		where: { userId },
		order: [["createdAt", sort === "asc" ? "ASC" : "DESC"]],
		limit: parseInt(pageSize, 10),
		offset,
	});

	const list = await Promise.all(
		rows.map(async (trip) => {
			const expenseCount = await Expense.count({ where: { tripId: trip.id } });
			const noteCount = await Note.count({ where: { tripId: trip.id } });
			return {
				...trip.toJSON(),
				expenseCount,
				noteCount,
			};
		}),
	);

	return { list, total: count, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) };
}

async function getTripById(tripId, userId, userRole) {
	const trip = await Trip.findOne({
		where: { id: tripId },
		include: [{ model: User, attributes: ["id", "username", "avatarUrl", "isDisabled"] }],
	});
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}

	const isOwner = trip.userId === userId;
	const isAdmin = userRole === "admin";

	// 管理员可查看所有旅程，普通用户只能查看自己的或公开的旅程
	if (!isAdmin && !isOwner && trip.isPublic !== 1) {
		throw new AppError("无权查看该旅程", 403);
	}

	const expenseCount = await Expense.count({ where: { tripId: trip.id } });
	const noteCount = await Note.count({ where: { tripId: trip.id } });

	return {
		...trip.toJSON(),
		expenseCount,
		noteCount,
		isOwner,
		isAdmin,
	};
}

async function getPublicTripById(tripId) {
	const trip = await Trip.findOne({
		where: { id: tripId, isPublic: 1 },
		include: [{ model: User, attributes: ["id", "username", "avatarUrl", "isDisabled"] }],
	});

	if (!trip) {
		throw new AppError("公开旅程不存在或已设为私密", 404);
	}

	// 如果作者已被禁用，则不展示该旅程
	if (trip.User && trip.User.isDisabled === 1) {
		throw new AppError("该旅程因作者账号状态异常已不可见", 410);
	}

	const expenses = await Expense.findAll({
		where: { tripId: trip.id },
		order: [["expenseDate", "DESC"]],
	});
	const expenseCount = expenses.length;
	const notes = await Note.findAll({
		where: { tripId: trip.id },
		order: [["noteDate", "DESC"]],
	});

	return {
		...trip.toJSON(),
		expenseCount,
		expenses,
		noteCount: notes.length,
		notes,
	};
}

async function updateTrip(tripId, userId, updateData) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权修改该旅程", 403);
	}

	// 允许用户直接修改的字段
	// isPublic: 设为公开 (1) 需通过审核流程 (submitAudit)，设为私密 (0) 可直接更新
	const allowedFields = ["title", "destination", "startDate", "endDate", "coverImage", "isEnded", "isPublic"];
	const filteredData = {};
	for (const key of allowedFields) {
		if (updateData[key] !== undefined) {
			filteredData[key] = updateData[key];
		}
	}

	// 防护：仅当旅程当前为私密(isPublic=0 或 null)且尝试设为公开时才拦截
	// 已公开的旅程允许直接编辑其他字段
	if (filteredData.isPublic === 1 && !trip.isPublic) {
		throw new AppError("公开旅程需提交审核申请，请使用审核流程", 400);
	}

	await trip.update(filteredData);
	return trip;
}

async function deleteTrip(tripId, userId) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权删除该旅程", 403);
	}

	const notes = await Note.findAll({ where: { tripId } });
	for (const note of notes) {
		await deleteNoteFiles(note);
	}
	await Note.destroy({ where: { tripId } });

	const expenses = await Expense.findAll({ where: { tripId } });
	for (const expense of expenses) {
		if (expense.receiptImages && Array.isArray(expense.receiptImages)) {
			for (const img of expense.receiptImages) {
				deleteFile(img);
			}
		}
	}
	await Expense.destroy({ where: { tripId } });

	if (trip.coverImage) {
		deleteFile(trip.coverImage);
	}

	await trip.destroy();
	return { message: "旅程已删除" };
}

async function getPublicTrips({ page = 1, pageSize = 10 }) {
	const offset = (page - 1) * pageSize;

	// 先查询被禁用的用户 ID 列表
	const disabledUsers = await User.findAll({
		where: { isDisabled: 1 },
		attributes: ["id"],
	});
	const disabledUserIds = disabledUsers.map((u) => u.id);

	const where = { isPublic: 1 };
	if (disabledUserIds.length > 0) {
		where.userId = { [Op.notIn]: disabledUserIds };
	}

	const { count, rows } = await Trip.findAndCountAll({
		where,
		order: [["createdAt", "DESC"]],
		limit: parseInt(pageSize, 10),
		offset,
		include: [{ model: User, attributes: ["id", "username", "avatarUrl"] }],
	});

	return { list: rows, total: count, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) };
}

function deleteFile(filePath) {
	try {
		const absolutePath = join(__dirname, "..", "..", filePath);
		if (fs.existsSync(absolutePath)) {
			fs.unlinkSync(absolutePath);
		}
	} catch (error) {
		console.error("删除文件失败:", filePath, error.message);
	}
}

async function deleteNoteFiles(note) {
	if (note.images && Array.isArray(note.images)) {
		for (const img of note.images) {
			deleteFile(img);
		}
	}
}

export { createTrip, getUserTrips, getTripById, updateTrip, deleteTrip, getPublicTrips, getPublicTripById };
