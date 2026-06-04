import api from "./client";
import type { ApiResponse, Expense, ExpenseStats, PaginatedData } from "../types";

export interface TempFileResult {
	fileId: string;
	imageUrl: string;
	ext: string;
}

export async function createExpense(tripId: string, data: Record<string, unknown>): Promise<Expense> {
	const res = await api.post<ApiResponse<Expense>>(`/trips/${tripId}/expenses`, data);
	return res.data.data;
}

export async function getTripExpenses(tripId: string, params?: Record<string, string | number>): Promise<PaginatedData<Expense>> {
	const res = await api.get<ApiResponse<PaginatedData<Expense>>>(`/trips/${tripId}/expenses`, { params });
	return res.data.data;
}

export async function getExpenseStats(tripId: string): Promise<ExpenseStats> {
	const res = await api.get<ApiResponse<ExpenseStats>>(`/trips/${tripId}/expenses/stats`);
	return res.data.data;
}

export async function deleteExpense(id: string): Promise<void> {
	await api.delete(`/expenses/${id}`);
}

export async function updateExpense(id: string, data: Record<string, unknown>): Promise<Expense> {
	const res = await api.patch<ApiResponse<Expense>>(`/expenses/${id}`, data);
	return res.data.data;
}

export async function getExpenseById(id: string): Promise<Expense> {
	const res = await api.get<ApiResponse<Expense>>(`/expenses/${id}`);
	return res.data.data;
}

export async function uploadFileToTemp(file: File): Promise<TempFileResult> {
	const formData = new FormData();
	formData.append("file", file);
	const res = await api.post<ApiResponse<TempFileResult>>("/upload", formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return res.data.data;
}

export async function persistSingle(fileId: string, ext: string): Promise<{ imageUrl: string }> {
	const res = await api.post<ApiResponse<{ imageUrl: string }>>("/upload/persist-single", { fileId, ext });
	return res.data.data;
}

export async function persistMultiple(files: { fileId: string; ext: string }[]): Promise<{ imageUrl: string }[]> {
	const res = await api.post<ApiResponse<{ imageUrl: string }[]>>("/upload/persist-multiple", { files });
	return res.data.data;
}
