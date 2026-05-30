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

let potrace = null;
try {
	const potraceModule = await import("potrace");
	potrace = potraceModule;
} catch (e) {
	console.warn("potrace 未安装，图片矢量化功能将不可用");
}

async function vectorizeImage(imagePath) {
	if (!potrace) {
		console.warn("potrace 不可用，跳过矢量化");
		return null;
	}
	try {
		const svg = await new Promise((resolve, reject) => {
			potrace.trace(imagePath, (err, svg) => {
				if (err) reject(err);
				else resolve(svg);
			});
		});
		const pathModule = await import("path");
		const svgFileName = pathModule.basename(imagePath, pathModule.extname(imagePath)) + ".svg";
		const svgDir = join(__dirname, "..", "..", "uploads", "vectors");
		if (!fs.existsSync(svgDir)) {
			fs.mkdirSync(svgDir, { recursive: true });
		}
		const svgPath = join(svgDir, svgFileName);
		fs.writeFileSync(svgPath, svg);
		return "/uploads/vectors/" + svgFileName;
	} catch (error) {
		console.error("矢量化失败:", imagePath, error.message);
		return null;
	}
}

async function createNote(tripId, userId, { content, noteDate, imageFiles }) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权操作该旅程", 403);
	}

	const images = [];
	const vectorImages = [];

	if (imageFiles && imageFiles.length > 0) {
		for (const file of imageFiles) {
			const imageUrl = "/uploads/images/" + file.filename;
			images.push(imageUrl);
			const absolutePath = join(__dirname, "..", "..", "uploads", "images", file.filename);
			const vectorUrl = await vectorizeImage(absolutePath);
			vectorImages.push(vectorUrl);
		}
	}

	const note = await Note.create({
		tripId,
		content,
		noteDate,
		images: images.length > 0 ? images : null,
		vectorImages: vectorImages.length > 0 ? vectorImages : null,
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
	const vectorImages = [];

	if (tempFiles && tempFiles.length > 0) {
		for (const tmp of tempFiles) {
			const result = await moveFromTmpToPermanent(tmp.fileId, tmp.ext);
			images.push(result.imageUrl);
			vectorImages.push(result.vectorUrl);
		}
	}

	const note = await Note.create({
		tripId,
		content,
		noteDate,
		images: images.length > 0 ? images : null,
		vectorImages: vectorImages.length > 0 ? vectorImages : null,
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
	if (note.vectorImages && Array.isArray(note.vectorImages)) {
		for (const vec of note.vectorImages) {
			deleteFile(vec);
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

export { createNote, createNoteWithTempFiles, getTripNotes, deleteNote };
