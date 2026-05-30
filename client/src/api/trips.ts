import api from "./client";
import type { ApiResponse, Trip, PaginatedData } from "../types";

export async function createTrip(data: {
	title: string;
	destination: string;
	startDate: string;
	endDate: string;
	coverImage?: string;
	isPublic?: number;
}): Promise<Trip> {
	const res = await api.post<ApiResponse<Trip>>("/trips", data);
	return res.data.data;
}

export async function getTrips(params?: { page?: number; pageSize?: number; sort?: string }): Promise<PaginatedData<Trip>> {
	const res = await api.get<ApiResponse<PaginatedData<Trip>>>("/trips", {
		params,
	});
	return res.data.data;
}

export async function getTripById(id: string): Promise<Trip> {
	const res = await api.get<ApiResponse<Trip>>(`/trips/${id}`);
	return res.data.data;
}

export async function updateTrip(id: string, data: Partial<Trip>): Promise<Trip> {
	const res = await api.patch<ApiResponse<Trip>>(`/trips/${id}`, data);
	return res.data.data;
}

export async function deleteTrip(id: string): Promise<void> {
	await api.delete(`/trips/${id}`);
}

export async function getPublicTrips(params?: { page?: number; pageSize?: number }): Promise<PaginatedData<Trip>> {
	const res = await api.get<ApiResponse<PaginatedData<Trip>>>("/trips/public", { params });
	return res.data.data;
}

export async function getPublicTripById(id: string): Promise<Trip> {
	const res = await api.get<ApiResponse<Trip>>(`/trips/public/${id}`);
	return res.data.data;
}
