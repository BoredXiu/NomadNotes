import { exportNotes } from "../services/exportService.js";

/**
 * 导出游记
 * GET /api/trips/:tripId/notes/export
 * 查询参数: format (html|markdown|pdf), noteIds (逗号分隔的ID列表)
 */
export async function exportTripNotes(req, res, next) {
	try {
		const { tripId } = req.params;
		const userId = req.userId;
		const format = req.query.format || "html";
		const noteIdsParam = req.query.noteIds;

		let noteIds = null;
		if (noteIdsParam) {
			noteIds = noteIdsParam.split(",").filter(Boolean);
		}

		const result = await exportNotes(tripId, userId, format, noteIds);

		// 根据格式设置不同的 Content-Type
		const contentTypeMap = {
			html: "text/html; charset=utf-8",
			markdown: "text/markdown; charset=utf-8",
			pdf: "text/html; charset=utf-8",
		};

		res.setHeader("Content-Type", contentTypeMap[format] || "text/plain");
		res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(result.filename)}"`);
		res.send(result.content);
	} catch (error) {
		next(error);
	}
}
