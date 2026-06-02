import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Expense = sequelize.define(
	"Expense",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		tripId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		category: {
			type: DataTypes.STRING(20),
			allowNull: false,
			validate: {
				isIn: [["餐饮", "交通", "住宿", "购物", "门票", "其他"]],
			},
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		note: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		receiptImage: {
			type: DataTypes.STRING(500),
			allowNull: true,
		},
		expenseDate: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: "expenses",
		timestamps: false,
	},
);

export default Expense;
