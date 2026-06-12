import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

/**
 * 通知模型
 * 存储系统向用户发送的通知信息，如审核结果通知
 * 通过 userId 逻辑关联 users 表，通过 tripId 逻辑关联 trips 表
 */
const Notification = sequelize.define(
    "Notification",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        // 接收通知的用户 ID，逻辑关联 users 表
        userId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        // 通知类型：audit_approved（审核通过）, audit_rejected（审核驳回）
        type: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        // 通知标题
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        // 通知详情内容
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // 关联旅程 ID，逻辑关联 trips 表
        tripId: {
            type: DataTypes.CHAR(36),
            allowNull: true,
        },
        // 是否已读：0 未读，1 已读
        isRead: {
            type: DataTypes.TINYINT,
            defaultValue: 0,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "notifications",
        timestamps: false,
        indexes: [
            {
                fields: ["userId"],
            },
            {
                fields: ["userId", "isRead"],
            },
            {
                fields: ["createdAt"],
            },
        ],
    },
);

export default Notification;