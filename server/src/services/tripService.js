import Trip from "../models/Trip.js";
import Expense from "../models/Expense.js";
import Note from "../models/Note.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import fs from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createTrip({ userId, title, destination, startDate, endDate, coverImage, isPublic }) {
	const trip = await Trip.create({
		userId,
		title,
		destination,
		startDate,
		endDate,
		coverImage: coverImage || null,
		isPublic: isPublic ? 1 : 0,
	});
	return trip;
}

async function getUserTrips(userId, { page = 1, pageSize = 10, sort = "desc" }) {
	const offset = (page - 1) * pageSize;
	const { count, rows } = await Trip.findAndCountAll({
		where: { userId },
		order: [["createdAt", sort === "asc" ? "ASC" : "DESC"]],
		limit: parseInt(pageSize, 10),
		offset,
	});

	const list = await Promise.all(
		rows.map(async (trip) => {
			const expenseCount = await Expense.count({ where: { tripId: trip.id } });
			const noteCount = await Note.count({ where: { tripId: trip.id } });
			return {
				...trip.toJSON(),
				expenseCount,
				noteCount,
			};
		}),
	);

	return { list, total: count, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) };
}

async function getTripById(tripId, userId) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}

	const isOwner = trip.userId === userId;

	if (!isOwner && trip.isPublic !== 1) {
		throw new AppError("无权查看该旅程", 403);
	}

	const expenseCount = await Expense.count({ where: { tripId: trip.id } });
	const noteCount = await Note.count({ where: { tripId: trip.id } });

	return {
		...trip.toJSON(),
		expenseCount,
		noteCount,
		isOwner,
	};
}

async function getPublicTripById(tripId) {
	const trip = await Trip.findOne({
		where: { id: tripId, isPublic: 1 },
		include: [{ model: User, attributes: ["id", "username", "avatarUrl"] }],
	});

	if (!trip) {
		throw new AppError("公开旅程不存在或已设为私密", 404);
	}

	const expenses = await Expense.findAll({
		where: { tripId: trip.id },
		order: [["expenseDate", "DESC"]],
	});
	const expenseCount = expenses.length;
	const notes = await Note.findAll({
		where: { tripId: trip.id },
		order: [["noteDate", "DESC"]],
	});

	return {
		...trip.toJSON(),
		expenseCount,
		expenses,
		noteCount: notes.length,
		notes,
	};
}

async function updateTrip(tripId, userId, updateData) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权修改该旅程", 403);
	}

	const allowedFields = ["title", "destination", "startDate", "endDate", "coverImage", "isEnded", "isPublic"];
	const filteredData = {};
	for (const key of allowedFields) {
		if (updateData[key] !== undefined) {
			filteredData[key] = updateData[key];
		}
	}

	await trip.update(filteredData);
	return trip;
}

async function deleteTrip(tripId, userId) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权删除该旅程", 403);
	}

	const notes = await Note.findAll({ where: { tripId } });
	for (const note of notes) {
		await deleteNoteFiles(note);
	}
	await Note.destroy({ where: { tripId } });

	const expenses = await Expense.findAll({ where: { tripId } });
	for (const expense of expenses) {
		if (expense.receiptImage) {
			deleteFile(expense.receiptImage);
		}
	}
	await Expense.destroy({ where: { tripId } });

	if (trip.coverImage) {
		deleteFile(trip.coverImage);
	}

	await trip.destroy();
	return { message: "旅程已删除" };
}

async function getPublicTrips({ page = 1, pageSize = 10 }) {
	const offset = (page - 1) * pageSize;
	const { count, rows } = await Trip.findAndCountAll({
		where: { isPublic: 1 },
		order: [["createdAt", "DESC"]],
		limit: parseInt(pageSize, 10),
		offset,
		include: [{ model: User, attributes: ["id", "username", "avatarUrl"] }],
	});

	return { list: rows, total: count, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) };
}

function deleteFile(filePath) {
	try {
		const absolutePath = join(__dirname, "..", "..", filePath);
		if (fs.existsSync(absolutePath)) {
			fs.unlinkSync(absolutePath);
		}
	} catch (error) {
		console.error("删除文件失败:", filePath, error.message);
	}
}

async function deleteNoteFiles(note) {
	if (note.images && Array.isArray(note.images)) {
		for (const img of note.images) {
			deleteFile(img);
		}
	}
}

export { createTrip, getUserTrips, getTripById, updateTrip, deleteTrip, getPublicTrips, getPublicTripById };
