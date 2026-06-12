import { Router } from "express";
import * as notificationController from "../controllers/notificationController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.use(auth);

// 获取通知列表
router.get("/", notificationController.getNotifications);

// 获取未读数量
router.get("/unread-count", notificationController.getUnreadCount);

// 标记单条为已读
router.patch("/:id/read", notificationController.markAsRead);

// 标记全部为已读
router.patch("/read-all", notificationController.markAllAsRead);

export default router;