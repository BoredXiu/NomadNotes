import * as adminService from "../services/adminService.js";
import User from "../models/User.js";

/**
 * 管理员控制器
 * 处理审核管理 + 用户管理 + 旅程管理 + 操作日志
 */

// ===================== 审核控制器 =====================

/**
 * 提交审核申请
 * POST /api/admin/audits
 */
export async function submitAudit(req, res, next) {
    try {
        const { tripId } = req.body;
        const userId = req.userId;

        if (!tripId) {
            return res.status(400).json({
                success: false,
                message: "缺少旅程 ID",
            });
        }

        const auditLog = await adminService.submitAudit(tripId, userId);

        res.status(201).json({
            success: true,
            data: auditLog,
            message: "已提交到管理员审核",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 提交审核申请（通过 URL 参数传递 tripId）
 * POST /api/trips/:tripId/submit-audit
 */
export async function submitAuditByTripParam(req, res, next) {
    try {
        const tripId = req.params.id;
        const userId = req.userId;

        const auditLog = await adminService.submitAudit(tripId, userId);

        res.status(201).json({
            success: true,
            data: auditLog,
            message: "已提交到管理员审核",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 获取审核列表（管理员）
 * GET /api/admin/audits
 */
export async function getAuditList(req, res, next) {
    try {
        const { status, page = 1, pageSize = 10, sort = "desc" } = req.query;

        const result = await adminService.getAuditList({
            status,
            page: Number(page),
            pageSize: Number(pageSize),
            sort,
        });

        const pendingCount = await adminService.getPendingCount();

        res.json({
            success: true,
            data: result,
            pendingCount,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 获取待审核数量
 * GET /api/admin/audits/pending-count
 */
export async function getPendingCount(req, res, next) {
    try {
        const count = await adminService.getPendingCount();

        res.json({
            success: true,
            data: { count },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 审批通过
 * POST /api/admin/audits/:id/approve
 */
export async function approveAudit(req, res, next) {
    try {
        const { id } = req.params;
        const adminId = req.userId;
        const admin = await User.findByPk(adminId, { attributes: ["username"] });
        const adminName = admin ? admin.username : "unknown";

        const auditLog = await adminService.approveAudit(id, adminId, adminName);

        res.json({
            success: true,
            data: auditLog,
            message: "审核已通过，旅程已设为公开",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 驳回审核
 * POST /api/admin/audits/:id/reject
 */
export async function rejectAudit(req, res, next) {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.userId;
        const admin = await User.findByPk(adminId, { attributes: ["username"] });
        const adminName = admin ? admin.username : "unknown";

        const auditLog = await adminService.rejectAudit(id, adminId, adminName, reason);

        res.json({
            success: true,
            data: auditLog,
            message: "审核已驳回",
        });
    } catch (error) {
        next(error);
    }
}

// ===================== 用户管理控制器 =====================

/**
 * 获取用户列表
 * GET /api/admin/users
 */
export async function getUserList(req, res, next) {
    try {
        const { page = 1, pageSize = 20, keyword, sort = "desc" } = req.query;

        const result = await adminService.getUserList({
            page: Number(page),
            pageSize: Number(pageSize),
            keyword,
            sort,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 切换用户禁用/启用状态
 * PATCH /api/admin/users/:id/status
 */
export async function toggleUserStatus(req, res, next) {
    try {
        const { id } = req.params;
        const adminId = req.userId;
        const admin = await User.findByPk(adminId, { attributes: ["username"] });
        const adminName = admin ? admin.username : "unknown";

        const result = await adminService.toggleUserStatus(id, adminId, adminName);

        res.json({
            success: true,
            data: result,
            message: result.user.isDisabled === 1 ? "用户已禁用" : "用户已启用",
        });
    } catch (error) {
        next(error);
    }
}

// ===================== 旅程管理控制器 =====================

/**
 * 获取全部旅程列表（管理员视角）
 * GET /api/admin/trips
 */
export async function getAdminTripList(req, res, next) {
    try {
        const {
            page = 1, pageSize = 10, isPublic, isEnded, keyword, sort = "desc",
        } = req.query;

        const result = await adminService.getAdminTripList({
            page: Number(page),
            pageSize: Number(pageSize),
            isPublic: isPublic !== undefined ? Number(isPublic) : undefined,
            isEnded: isEnded !== undefined ? Number(isEnded) : undefined,
            keyword,
            sort,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 下架/恢复旅程
 * PATCH /api/admin/trips/:id/takedown
 */
export async function takedownTrip(req, res, next) {
    try {
        const { id } = req.params;
        const adminId = req.userId;
        const admin = await User.findByPk(adminId, { attributes: ["username"] });
        const adminName = admin ? admin.username : "unknown";

        const result = await adminService.takedownTrip(id, adminId, adminName);

        res.json({
            success: true,
            data: result,
            message: result.trip.isPublic === 0 ? "旅程已下架" : "旅程已恢复",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 强制删除旅程
 * DELETE /api/admin/trips/:id
 */
export async function forceDeleteTrip(req, res, next) {
    try {
        const { id } = req.params;
        const adminId = req.userId;
        const admin = await User.findByPk(adminId, { attributes: ["username"] });
        const adminName = admin ? admin.username : "unknown";

        await adminService.forceDeleteTrip(id, adminId, adminName);

        res.json({
            success: true,
            data: null,
            message: "旅程及关联数据已彻底删除",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 删除旅程中的游记
 * DELETE /api/admin/trips/:tripId/notes/:noteId
 */
export async function deleteTripNote(req, res, next) {
    try {
        const { tripId, noteId } = req.params;
        const adminId = req.userId;
        const admin = await User.findByPk(adminId, { attributes: ["username"] });
        const adminName = admin ? admin.username : "unknown";

        await adminService.deleteTripNote(tripId, noteId, adminId, adminName);

        res.json({
            success: true,
            data: null,
            message: "游记已删除",
        });
    } catch (error) {
        next(error);
    }
}

// ===================== 操作日志控制器 =====================

/**
 * 获取操作日志
 * GET /api/admin/operations
 */
export async function getOperationLogs(req, res, next) {
    try {
        const { page = 1, pageSize = 20, operationType, sort = "desc" } = req.query;

        const result = await adminService.getOperationLogs({
            page: Number(page),
            pageSize: Number(pageSize),
            operationType,
            sort,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}