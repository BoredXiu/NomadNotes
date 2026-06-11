import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const User = sequelize.define(
	"User",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		username: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: true,
			validate: { len: [2, 50] },
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: true,
			validate: { isEmail: true },
		},
		passwordHash: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		avatarUrl: {
			type: DataTypes.STRING(500),
			allowNull: true,
		},
		bio: {
			type: DataTypes.STRING(500),
			allowNull: true,
		},
		address: {
			type: DataTypes.STRING(200),
			allowNull: true,
		},
		gender: {
			type: DataTypes.ENUM("male", "female", "other"),
			allowNull: true,
		},
		// 用户角色：admin 为管理员，user 为普通用户，默认 user
		role: {
			type: DataTypes.ENUM("admin", "user"),
			allowNull: false,
			defaultValue: "user",
		},
		// 账号是否被禁用：0 正常，1 已禁用（禁用后无法登录，公开内容不展示）
		isDisabled: {
			type: DataTypes.TINYINT,
			allowNull: false,
			defaultValue: 0,
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: "users",
		timestamps: false,
	},
);

export default User;
