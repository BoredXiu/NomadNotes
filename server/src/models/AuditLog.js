import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

/**
 * 审核日志模型
 * 记录旅程公开申请的审核流程：
 * - 用户点击"公开"时创建 pending 记录
 * - 管理员审批后状态变更为 approved/rejected
 * - 记录审核人、审核时间、审核意见
 */
const AuditLog = sequelize.define(
    "AuditLog",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        // 关联的旅程 ID，逻辑关联 trips 表
        tripId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        // 申请用户 ID，逻辑关联 users 表
        userId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        // 审核状态：pending 待审核，approved 已通过，rejected 已驳回
        status: {
            type: DataTypes.ENUM("pending", "approved", "rejected"),
            allowNull: false,
            defaultValue: "pending",
        },
        // 审核人 ID（管理员），逻辑关联 users 表，审核前为 null
        reviewedBy: {
            type: DataTypes.CHAR(36),
            allowNull: true,
        },
        // 审核人姓名（冗余存储，便于直接展示）
        reviewedByName: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        // 审核时间
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        // 审核意见（驳回理由或备注）
        reason: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "audit_logs",
        timestamps: false,
    },
);

export default AuditLog;