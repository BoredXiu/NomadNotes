import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Trip = sequelize.define(
	"Trip",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		title: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		destination: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		startDate: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		endDate: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		coverImage: {
			type: DataTypes.STRING(500),
			allowNull: true,
		},
		isEnded: {
			type: DataTypes.TINYINT,
			allowNull: false,
			defaultValue: 0,
		},
		isPublic: {
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
		tableName: "trips",
		timestamps: false,
	},
);

export default Trip;
