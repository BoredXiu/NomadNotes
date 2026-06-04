import Expense from "../models/Expense.js";
import Trip from "../models/Trip.js";
import { AppError } from "../utils/AppError.js";
import { Op } from "sequelize";
import fs from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createExpense(tripId, userId, expenseData) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权操作该旅程", 403);
	}

	const expense = await Expense.create({
		tripId,
		...expenseData,
	});
	return expense;
}

async function getTripExpenses(tripId, userId, query) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权查看该旅程", 403);
	}

	const { category, startDate, endDate, page = 1, pageSize = 20 } = query;
	const offset = (page - 1) * pageSize;
	const where = { tripId };

	if (category) {
		where.category = category;
	}
	if (startDate) {
		where.expenseDate = { ...where.expenseDate, [Op.gte]: startDate };
	}
	if (endDate) {
		where.expenseDate = { ...where.expenseDate, [Op.lte]: endDate };
	}

	const { count, rows } = await Expense.findAndCountAll({
		where,
		order: [["expenseDate", "DESC"]],
		limit: parseInt(pageSize, 10),
		offset,
	});

	return { list: rows, total: count, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) };
}

async function getExpenseStats(tripId, userId) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权查看该旅程", 403);
	}

	const expenses = await Expense.findAll({ where: { tripId } });
	const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

	const categoryMap = {};
	for (const e of expenses) {
		if (!categoryMap[e.category]) {
			categoryMap[e.category] = { total: 0, count: 0 };
		}
		categoryMap[e.category].total += parseFloat(e.amount);
		categoryMap[e.category].count += 1;
	}

	const categories = Object.entries(categoryMap).map(([category, data]) => ({
		category,
		total: Math.round(data.total * 100) / 100,
		count: data.count,
	}));

	return { total: Math.round(total * 100) / 100, categories };
}

async function deleteExpense(expenseId, userId) {
	const expense = await Expense.findByPk(expenseId);
	if (!expense) {
		throw new AppError("账单不存在", 404);
	}

	const trip = await Trip.findByPk(expense.tripId);
	if (!trip || trip.userId !== userId) {
		throw new AppError("无权删除该账单", 403);
	}

	if (expense.receiptImages && Array.isArray(expense.receiptImages)) {
		for (const imagePath of expense.receiptImages) {
			try {
				const absolutePath = join(__dirname, "..", "..", imagePath);
				if (fs.existsSync(absolutePath)) {
					fs.unlinkSync(absolutePath);
				}
			} catch (error) {
				console.error("删除小票文件失败:", error.message);
			}
		}
	}

	await expense.destroy();
	return { message: "账单已删除" };
}

async function updateExpense(expenseId, userId, updateData) {
	const expense = await Expense.findByPk(expenseId);
	if (!expense) {
		throw new AppError("账单不存在", 404);
	}

	const trip = await Trip.findByPk(expense.tripId);
	if (!trip || trip.userId !== userId) {
		throw new AppError("无权修改该账单", 403);
	}

	const allowedFields = ["category", "amount", "expenseDate", "note"];
	const filteredData = {};
	for (const key of allowedFields) {
		if (updateData[key] !== undefined) {
			filteredData[key] = updateData[key];
		}
	}

	if (updateData.receiptImages !== undefined) {
		if (expense.receiptImages && Array.isArray(expense.receiptImages)) {
			for (const oldPath of expense.receiptImages) {
				if (!updateData.receiptImages || !updateData.receiptImages.includes(oldPath)) {
					try {
						const absolutePath = join(__dirname, "..", "..", oldPath);
						if (fs.existsSync(absolutePath)) {
							fs.unlinkSync(absolutePath);
						}
					} catch (error) {
						console.error("删除旧小票文件失败:", error.message);
					}
				}
			}
		}
		filteredData.receiptImages = updateData.receiptImages;
	}

	await expense.update(filteredData);
	return expense;
}

async function getExpenseById(expenseId, userId) {
	const expense = await Expense.findByPk(expenseId);
	if (!expense) {
		throw new AppError("账单不存在", 404);
	}

	const trip = await Trip.findByPk(expense.tripId);
	if (!trip || trip.userId !== userId) {
		throw new AppError("无权查看该账单", 403);
	}

	return expense;
}

export { createExpense, getTripExpenses, getExpenseStats, deleteExpense, updateExpense, getExpenseById };
