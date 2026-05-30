import * as noteService from "../services/noteService.js";

async function createNote(req, res, next) {
	try {
		let note;
		if (req.body.tempFiles) {
			const tempFiles = Array.isArray(req.body.tempFiles) ? req.body.tempFiles : JSON.parse(req.body.tempFiles);
			note = await noteService.createNoteWithTempFiles(req.params.tripId, req.userId, {
				content: req.body.content,
				noteDate: req.body.noteDate,
				tempFiles,
			});
		} else {
			note = await noteService.createNote(req.params.tripId, req.userId, {
				content: req.body.content,
				noteDate: req.body.noteDate,
				imageFiles: req.files || [],
			});
		}
		res.status(201).json({
			success: true,
			data: note,
			message: "游记创建成功",
		});
	} catch (error) {
		next(error);
	}
}

async function getTripNotes(req, res, next) {
	try {
		const notes = await noteService.getTripNotes(req.params.tripId, req.userId, req.query);
		res.json({
			success: true,
			data: notes,
			message: "success",
		});
	} catch (error) {
		next(error);
	}
}

async function deleteNote(req, res, next) {
	try {
		const result = await noteService.deleteNote(req.params.id, req.userId);
		res.json({
			success: true,
			data: result,
			message: "游记已删除",
		});
	} catch (error) {
		next(error);
	}
}

export { createNote, getTripNotes, deleteNote };
