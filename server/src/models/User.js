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
