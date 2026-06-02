import Note from "../models/Note.js";
import Trip from "../models/Trip.js";
import { AppError } from "../utils/AppError.js";
import { moveFromTmpToPermanent } from "./uploadService.js";
import fs from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createNote(tripId, userId, { content, noteDate, imageFiles }) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权操作该旅程", 403);
	}

	const images = [];

	if (imageFiles && imageFiles.length > 0) {
		for (const file of imageFiles) {
			const imageUrl = "/uploads/images/" + file.filename;
			images.push(imageUrl);
		}
	}

	const note = await Note.create({
		tripId,
		content,
		noteDate,
		images: images.length > 0 ? images : null,
	});

	return note;
}

async function getTripNotes(tripId, userId, { sort = "asc" }) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权查看该旅程", 403);
	}

	const notes = await Note.findAll({
		where: { tripId },
		order: [["noteDate", sort === "asc" ? "ASC" : "DESC"]],
	});

	return notes;
}

async function createNoteWithTempFiles(tripId, userId, { content, noteDate, tempFiles }) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权操作该旅程", 403);
	}

	const images = [];

	if (tempFiles && tempFiles.length > 0) {
		for (const tmp of tempFiles) {
			const result = await moveFromTmpToPermanent(tmp.fileId, tmp.ext);
			images.push(result.imageUrl);
		}
	}

	const note = await Note.create({
		tripId,
		content,
		noteDate,
		images: images.length > 0 ? images : null,
	});

	return note;
}

async function deleteNote(noteId, userId) {
	const note = await Note.findByPk(noteId);
	if (!note) {
		throw new AppError("游记不存在", 404);
	}

	const trip = await Trip.findByPk(note.tripId);
	if (!trip || trip.userId !== userId) {
		throw new AppError("无权删除该游记", 403);
	}

	if (note.images && Array.isArray(note.images)) {
		for (const img of note.images) {
			deleteFile(img);
		}
	}

	await note.destroy();
	return { message: "游记已删除" };
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

async function updateNote(noteId, userId, { content, noteDate, imageFiles, tempFiles }) {
	const note = await Note.findByPk(noteId);
	if (!note) {
		throw new AppError("游记不存在", 404);
	}

	const trip = await Trip.findByPk(note.tripId);
	if (!trip || trip.userId !== userId) {
		throw new AppError("无权修改该游记", 403);
	}

	const updateData = {};
	if (content !== undefined) updateData.content = content;
	if (noteDate !== undefined) updateData.noteDate = noteDate;

	if (imageFiles && imageFiles.length > 0) {
		if (note.images && Array.isArray(note.images)) {
			for (const img of note.images) {
				deleteFile(img);
			}
		}

		const images = [];
		for (const file of imageFiles) {
			const imageUrl = "/uploads/images/" + file.filename;
			images.push(imageUrl);
		}
		updateData.images = images.length > 0 ? images : null;
	} else if (tempFiles && tempFiles.length > 0) {
		if (note.images && Array.isArray(note.images)) {
			for (const img of note.images) {
				deleteFile(img);
			}
		}

		const images = [];
		for (const tmp of tempFiles) {
			const result = await moveFromTmpToPermanent(tmp.fileId, tmp.ext);
			images.push(result.imageUrl);
		}
		updateData.images = images.length > 0 ? images : null;
	}

	await note.update(updateData);
	return note;
}

async function getNoteById(noteId, userId) {
	const note = await Note.findByPk(noteId);
	if (!note) {
		throw new AppError("游记不存在", 404);
	}

	const trip = await Trip.findByPk(note.tripId);
	if (!trip || trip.userId !== userId) {
		throw new AppError("无权查看该游记", 403);
	}

	return note;
}

export { createNote, createNoteWithTempFiles, getTripNotes, deleteNote, updateNote, getNoteById };