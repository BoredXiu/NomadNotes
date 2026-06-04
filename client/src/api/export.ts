import api from "./client";
import type { ApiResponse } from "../types";

/**
 * 游记导出 API
 */

// 导出格式类型
export type ExportFormat = "html" | "markdown" | "pdf";

// 导出参数
export interface ExportParams {
	tripId: string;
	format: ExportFormat;
	noteIds?: string[] | null;
}

/**
 * 导出游记
 * 返回 Blob 用于浏览器下载
 */
export async function exportNotes(params: ExportParams): Promise<Blob> {
	const queryParams: Record<string, string> = {
		format: params.format,
	};
	if (params.noteIds && params.noteIds.length > 0) {
		queryParams.noteIds = params.noteIds.join(",");
	}

	const res = await api.get(`/trips/${params.tripId}/notes/export`, {
		params: queryParams,
		responseType: "blob",
	});
	return res.data;
}

/**
 * 触发浏览器下载
 * @param blob - 文件 Blob
 * @param filename - 文件名
 */
export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}