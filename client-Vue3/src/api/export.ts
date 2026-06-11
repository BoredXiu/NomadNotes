import api from "./client";

/** 导出格式类型 */
export type ExportFormat = "html" | "markdown" | "pdf" | "json";

/** 导出参数 */
export interface ExportParams {
	tripId: string;
	format: ExportFormat;
	noteIds: string[] | null;
}

/**
 * 导出游记（原 HTML/Markdown/PDF 导出，用于 ExportModal）
 * GET /api/trips/:tripId/notes/export
 */
export async function exportNotes(params: ExportParams) {
	const { tripId, format, noteIds } = params;
	const queryParams: Record<string, string> = { format };
	if (noteIds && noteIds.length > 0) {
		queryParams.noteIds = noteIds.join(",");
	}
	const res = await api.get(`/trips/${tripId}/notes/export`, {
		params: queryParams,
		responseType: "blob",
	});
	return res.data;
}

/**
 * 导出旅程数据（JSON 格式）
 * 导出内容包含账单和游记，附带元数据
 */
export async function exportTripData(tripId: string) {
	const res = await api.get(`/trips/${tripId}/export`, {
		responseType: "blob",
	});
	return res;
}

/**
 * 获取导出数据统计
 */
export async function getExportCount(tripId: string) {
	const res = await api.get(`/trips/${tripId}/export/count`);
	return res.data;
}

/**
 * 触发浏览器下载 Blob 文件
 */
export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
