import api from "./client";
import type { ApiResponse, Expense, ExpenseStats, PaginatedData } from "../types";

export async function createExpense(tripId: string, data: FormData): Promise<Expense> {
	const res = await api.post<ApiResponse<Expense>>(`/trips/${tripId}/expenses`, data, {
		headers: { "Content-Type": "multipart/form-data" },
	});
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

export async function uploadFile(file: File): Promise<string> {
	const formData = new FormData();
	formData.append("file", file);
	const res = await api.post<ApiResponse<{ url: string }>>("/upload", formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return res.data.data.url;
}
