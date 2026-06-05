import api from "./client";
import type { ApiResponse, Note } from "../types";

export interface TempFileResult {
	fileId: string;
	imageUrl: string;
	ext: string;
}

export async function createNote(tripId: string, data: FormData): Promise<Note> {
	const res = await api.post<ApiResponse<Note>>(`/trips/${tripId}/notes`, data, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return res.data.data;
}

export async function createNoteWithTempFiles(
	tripId: string,
	data: {
		content: string;
		noteDate: string;
		tempFiles: { fileId: string; ext: string }[];
	},
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

export async function updateNote(
	id: string,
	data: {
		content?: string;
		noteDate?: string;
		tempFiles?: { fileId: string; ext: string }[];
	},
): Promise<Note> {
	const res = await api.patch<ApiResponse<Note>>(`/notes/${id}`, data);
	return res.data.data;
}

export async function updateNoteFormData(id: string, formData: FormData): Promise<Note> {
	const res = await api.patch<ApiResponse<Note>>(`/notes/${id}`, formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return res.data.data;
}

export async function getNoteById(id: string): Promise<Note> {
	const res = await api.get<ApiResponse<Note>>(`/notes/${id}`);
	return res.data.data;
}
