import api from "./client";
import type { ApiResponse, PaginatedData } from "../types";

/** 通知项 */
export interface NotificationItem {
    id: string;
    userId: string;
    type: "audit_approved" | "audit_rejected";
    title: string;
    content: string | null;
    tripId: string | null;
    isRead: number;
    createdAt: string;
}

/** 获取用户通知列表 */
export async function getNotifications(page = 1, pageSize = 10) {
    const res = await api.get<ApiResponse<PaginatedData<NotificationItem>>>(
        "/notifications",
        { params: { page, pageSize } },
    );
    return res.data.data;
}

/** 获取未读通知数量 */
export async function getUnreadCount() {
    const res = await api.get<ApiResponse<{ count: number }>>(
        "/notifications/unread-count",
    );
    return res.data.data;
}

/** 标记单条通知为已读 */
export async function markAsRead(id: string) {
    const res = await api.patch<ApiResponse<NotificationItem>>(
        `/notifications/${id}/read`,
    );
    return res.data.data;
}

/** 标记所有通知为已读 */
export async function markAllAsRead() {
    const res = await api.patch<ApiResponse<null>>("/notifications/read-all");
    return res.data.data;
}