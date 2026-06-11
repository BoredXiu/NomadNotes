import api from "./client";

/**
 * 审核记录类型
 */
export interface AuditRecord {
	id: string;
	tripId: string;
	userId: string;
	status: "pending" | "approved" | "rejected";
	reviewedBy: string | null;
	reviewedByName: string | null;
	reviewedAt: string | null;
	reason: string | null;
	createdAt: string;
	Trip?: {
		id: string;
		title: string;
		destination: string;
		coverImage: string | null;
		isPublic: number;
	};
	User?: {
		id: string;
		username: string;
		avatarUrl: string | null;
	};
}

/**
 * 用户管理类型
 */
export interface AdminUser {
	id: string;
	username: string;
	email: string;
	avatarUrl: string | null;
	bio: string | null;
	role: "admin" | "user";
	isDisabled: number;
	createdAt: string;
}

/**
 * 旅程管理类型
 */
export interface AdminTrip {
	id: string;
	userId: string;
	title: string;
	destination: string;
	startDate: string;
	endDate: string;
	coverImage: string | null;
	isEnded: number;
	isPublic: number;
	createdAt: string;
	User?: {
		id: string;
		username: string;
		avatarUrl: string | null;
		isDisabled?: number;
	};
}

/**
 * 操作日志类型
 */
export interface AdminOperationLog {
	id: string;
	adminId: string;
	adminName: string;
	operationType: string;
	description: string;
	targetType: string | null;
	targetId: string | null;
	targetName: string | null;
	beforeSnapshot: string | null;
	afterSnapshot: string | null;
	createdAt: string;
}

// ===================== 审核 API =====================

/**
 * 提交旅程公开审核
 */
export async function submitAudit(tripId: string) {
	const res = await api.post(`/trips/${tripId}/submit-audit`);
	return res.data;
}

/**
 * 获取审核列表（管理员）
 */
export async function getAuditList(params: { status?: "pending" | "approved" | "rejected"; page?: number; pageSize?: number }) {
	const res = await api.get("/admin/audits", { params });
	return res.data;
}

/**
 * 获取待审核数量
 */
export async function getPendingCount() {
	const res = await api.get("/admin/audits/pending-count");
	return res.data;
}

/**
 * 审批通过
 */
export async function approveAudit(auditId: string) {
	const res = await api.post(`/admin/audits/${auditId}/approve`);
	return res.data;
}

/**
 * 驳回审核
 */
export async function rejectAudit(auditId: string, reason: string) {
	const res = await api.post(`/admin/audits/${auditId}/reject`, { reason });
	return res.data;
}

// ===================== 用户管理 API =====================

/**
 * 获取用户列表（管理员）
 */
export async function getAdminUserList(params: { page?: number; pageSize?: number; keyword?: string }) {
	const res = await api.get("/admin/users", { params });
	return res.data;
}

/**
 * 切换用户禁用/启用状态
 */
export async function toggleUserStatus(userId: string) {
	const res = await api.patch(`/admin/users/${userId}/status`);
	return res.data;
}

// ===================== 旅程管理 API =====================

/**
 * 获取全部旅程列表（管理员）
 */
export async function getAdminTripList(params: { page?: number; pageSize?: number; isPublic?: number; isEnded?: number; keyword?: string }) {
	const res = await api.get("/admin/trips", { params });
	return res.data;
}

/**
 * 下架/恢复旅程
 */
export async function takedownTrip(tripId: string) {
	const res = await api.patch(`/admin/trips/${tripId}/takedown`);
	return res.data;
}

/**
 * 强制删除旅程
 */
export async function forceDeleteTrip(tripId: string) {
	const res = await api.delete(`/admin/trips/${tripId}`);
	return res.data;
}

/**
 * 删除旅程中的游记
 */
export async function deleteTripNote(tripId: string, noteId: string) {
	const res = await api.delete(`/admin/trips/${tripId}/notes/${noteId}`);
	return res.data;
}

// ===================== 操作日志 API =====================

/**
 * 获取操作日志
 */
export async function getOperationLogs(params: { page?: number; pageSize?: number; operationType?: string }) {
	const res = await api.get("/admin/operations", { params });
	return res.data;
}
