import api from "./client";
import type { ApiResponse, Note } from "../types";

export interface TempFileResult {
	fileId: string;
	imageUrl: string;
	vectorUrl: string | null;
}

export async function createNote(tripId: string, data: FormData): Promise<Note> {
	const res = await api.post<ApiResponse<Note>>(`/trips/${tripId}/notes`, data, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return res.data.data;
}

export async function createNoteWithTempFiles(
	tripId: string,
	data: { content: string; noteDate: string; tempFiles: { fileId: string; ext: string }[] },
): Promise<Note> {
	const res = await api.post<ApiResponse<Note>>(`/trips/${tripId}/notes`, data);
	return res.data.data;
}

export async function uploadTmpImages(files: File[]): Promise<TempFileResult[]> {
	const formData = new FormData();
	files.forEach((file) => {
		formData.append("images", file);
	});
	const res = await api.post<ApiResponse<TempFileResult[]>>("/upload/tmp", formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return res.data.data;
}

export async function getTripNotes(tripId: string, params?: { sort?: string }): Promise<Note[]> {
	const res = await api.get<ApiResponse<Note[]>>(`/trips/${tripId}/notes`, { params });
	return res.data.data;
}

export async function deleteNote(id: string): Promise<void> {
	await api.delete(`/notes/${id}`);
}
