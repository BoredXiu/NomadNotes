import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { auth, adminAuth } from "../middleware/auth.js";

const router = Router();

// 所有管理员路由均需登录 + 管理员权限
router.use(auth);

// --- 审核相关 ---

// 提交审核申请（普通用户也可调用）
router.post("/audits", adminController.submitAudit);

// 以下路由仅管理员可访问
router.use(adminAuth);

// 获取审核列表
router.get("/audits", adminController.getAuditList);

// 获取待审核数量
router.get("/audits/pending-count", adminController.getPendingCount);

// 审批通过
router.post("/audits/:id/approve", adminController.approveAudit);

// 驳回审核
router.post("/audits/:id/reject", adminController.rejectAudit);

// --- 用户管理 ---

// 获取用户列表
router.get("/users", adminController.getUserList);

// 切换用户禁用/启用状态
router.patch("/users/:id/status", adminController.toggleUserStatus);

// --- 旅程管理 ---

// 获取全部旅程列表（管理员视角）
router.get("/trips", adminController.getAdminTripList);

// 下架/恢复旅程（切换 isPublic 状态）
router.patch("/trips/:id/takedown", adminController.takedownTrip);

// 强制删除旅程（含游记、账单、审核记录）
router.delete("/trips/:id", adminController.forceDeleteTrip);

// 删除旅程中的游记
router.delete("/trips/:tripId/notes/:noteId", adminController.deleteTripNote);

// --- 操作日志 ---

// 获取操作日志
router.get("/operations", adminController.getOperationLogs);

export default router;
