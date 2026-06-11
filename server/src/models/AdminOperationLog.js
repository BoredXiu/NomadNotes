import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

/**
 * 管理员操作日志模型
 * 记录所有管理员敏感操作的审计追踪信息
 * 包括操作人、操作时间、操作类型、操作详情、目标信息
 */
const AdminOperationLog = sequelize.define(
    "AdminOperationLog",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        // 操作人 ID（管理员），逻辑关联 users 表
        adminId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        // 操作人用户名（冗余存储，便于直接展示）
        adminName: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        // 操作类型枚举：
        // user_disable - 禁用用户
        // user_enable  - 启用用户
        // trip_takedown    - 下架旅程
        // trip_restore     - 恢复旅程
        // trip_delete      - 删除旅程
        operationType: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        // 操作描述，记录操作详情
        description: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        // 目标类型：user / trip / note / expense
        targetType: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        // 目标 ID，逻辑关联对应的资源表
        targetId: {
            type: DataTypes.CHAR(36),
            allowNull: true,
        },
        // 目标名称/标识（冗余存储，便于直接展示）
        targetName: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        // 操作前状态快照（JSON 字符串）
        beforeSnapshot: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // 操作后状态快照（JSON 字符串）
        afterSnapshot: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "admin_operation_logs",
        timestamps: false,
    },
);

export default AdminOperationLog;