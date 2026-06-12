import Notification from "../models/Notification.js";
import { AppError } from "../utils/AppError.js";

/**
 * 创建通知
 * 用于在审核通过/驳回时向用户发送系统通知
 */
async function createNotification({
    userId,
    type,
    title,
    content,
    tripId,
}) {
    const notification = await Notification.create({
        userId,
        type,
        title,
        content,
        tripId,
    });
    return notification;
}

/**
 * 获取用户的未读通知数量
 */
async function getUnreadCount(userId) {
    const count = await Notification.count({
        where: { userId, isRead: 0 },
    });
    return count;
}

/**
 * 获取用户的通知列表
 * 按创建时间倒序排列，支持分页
 */
async function getUserNotifications(userId, { page = 1, pageSize = 10 } = {}) {
    const offset = (page - 1) * pageSize;
    const { count, rows } = await Notification.findAndCountAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        offset,
        limit: pageSize,
    });
    return {
        list: rows,
        total: count,
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
    };
}

/**
 * 标记单条通知为已读
 */
async function markAsRead(notificationId, userId) {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
        throw new AppError("通知不存在", 404);
    }
    // 确保只能标记自己的通知
    if (notification.userId !== userId) {
        throw new AppError("无权操作此通知", 403);
    }
    await notification.update({ isRead: 1 });
    return notification;
}

/**
 * 标记用户所有通知为已读
 */
async function markAllAsRead(userId) {
    await Notification.update(
        { isRead: 1 },
        { where: { userId, isRead: 0 } },
    );
}

export {
    createNotification,
    getUnreadCount,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
};