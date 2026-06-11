import api from "./client";
import type { ApiResponse, PaginatedData } from "../types";

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
		isDisabled?: number;
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
export async function submitAudit(tripId: string): Promise<ApiResponse<AuditRecord>> {
	const res = await api.post<ApiResponse<AuditRecord>>(`/trips/${tripId}/submit-audit`);
	return res.data;
}

/**
 * 获取审核列表（管理员）
 */
export async function getAuditList(params: {
	status?: "pending" | "approved" | "rejected";
	page?: number;
	pageSize?: number;
}): Promise<ApiResponse<PaginatedData<AuditRecord>> & { pendingCount?: number }> {
	const res = await api.get<ApiResponse<PaginatedData<AuditRecord>>>("/admin/audits", {
		params,
	});
	return res.data as ApiResponse<PaginatedData<AuditRecord>> & { pendingCount?: number };
}

/**
 * 获取待审核数量
 */
export async function getPendingCount(): Promise<ApiResponse<{ count: number }>> {
	const res = await api.get<ApiResponse<{ count: number }>>("/admin/audits/pending-count");
	return res.data;
}

/**
 * 审批通过
 */
export async function approveAudit(auditId: string): Promise<ApiResponse<AuditRecord>> {
	const res = await api.post<ApiResponse<AuditRecord>>(`/admin/audits/${auditId}/approve`);
	return res.data;
}

/**
 * 驳回审核
 */
export async function rejectAudit(auditId: string, reason: string): Promise<ApiResponse<AuditRecord>> {
	const res = await api.post<ApiResponse<AuditRecord>>(`/admin/audits/${auditId}/reject`, {
		reason,
	});
	return res.data;
}

// ===================== 用户管理 API =====================

/**
 * 获取用户列表（管理员）
 */
export async function getAdminUserList(params: { page?: number; pageSize?: number; keyword?: string }): Promise<ApiResponse<PaginatedData<AdminUser>>> {
	const res = await api.get<ApiResponse<PaginatedData<AdminUser>>>("/admin/users", { params });
	return res.data;
}

/**
 * 切换用户禁用/启用状态
 */
export async function toggleUserStatus(userId: string): Promise<ApiResponse<{ user: AdminUser; operationLog: AdminOperationLog }>> {
	const res = await api.patch<ApiResponse<{ user: AdminUser; operationLog: AdminOperationLog }>>(`/admin/users/${userId}/status`);
	return res.data;
}

// ===================== 旅程管理 API =====================

/**
 * 获取全部旅程列表（管理员）
 */
export async function getAdminTripList(params: {
	page?: number;
	pageSize?: number;
	isPublic?: number;
	isEnded?: number;
	keyword?: string;
}): Promise<ApiResponse<PaginatedData<AdminTrip>>> {
	const res = await api.get<ApiResponse<PaginatedData<AdminTrip>>>("/admin/trips", { params });
	return res.data;
}

/**
 * 下架/恢复旅程
 */
export async function takedownTrip(tripId: string): Promise<ApiResponse<{ trip: AdminTrip; operationLog: AdminOperationLog }>> {
	const res = await api.patch<ApiResponse<{ trip: AdminTrip; operationLog: AdminOperationLog }>>(`/admin/trips/${tripId}/takedown`);
	return res.data;
}

/**
 * 强制删除旅程
 */
export async function forceDeleteTrip(tripId: string): Promise<ApiResponse<null>> {
	const res = await api.delete<ApiResponse<null>>(`/admin/trips/${tripId}`);
	return res.data;
}

/**
 * 删除旅程中的游记
 */
export async function deleteTripNote(tripId: string, noteId: string): Promise<ApiResponse<null>> {
	const res = await api.delete<ApiResponse<null>>(`/admin/trips/${tripId}/notes/${noteId}`);
	return res.data;
}

// ===================== 操作日志 API =====================

/**
 * 获取操作日志
 */
export async function getOperationLogs(params: {
	page?: number;
	pageSize?: number;
	operationType?: string;
}): Promise<ApiResponse<PaginatedData<AdminOperationLog>>> {
	const res = await api.get<ApiResponse<PaginatedData<AdminOperationLog>>>("/admin/operations", {
		params,
	});
	return res.data;
}
