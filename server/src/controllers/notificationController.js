import * as notificationService from "../services/notificationService.js";

/**
 * 获取用户的通知列表
 */
async function getNotifications(req, res, next) {
    try {
        const { page = 1, pageSize = 10 } = req.query;
        const result = await notificationService.getUserNotifications(
            req.userId,
            { page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) },
        );
        res.json({
            success: true,
            data: result,
            message: "success",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 获取未读通知数量
 */
async function getUnreadCount(req, res, next) {
    try {
        const count = await notificationService.getUnreadCount(req.userId);
        res.json({
            success: true,
            data: { count },
            message: "success",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 标记单条通知为已读
 */
async function markAsRead(req, res, next) {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id, req.userId);
        res.json({
            success: true,
            data: notification,
            message: "已标记已读",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 标记所有通知为已读
 */
async function markAllAsRead(req, res, next) {
    try {
        await notificationService.markAllAsRead(req.userId);
        res.json({
            success: true,
            data: null,
            message: "已全部标记已读",
        });
    } catch (error) {
        next(error);
    }
}

export {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};