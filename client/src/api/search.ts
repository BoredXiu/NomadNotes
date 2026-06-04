import api from "./client";
import type { ApiResponse, PaginatedData } from "../types";

/**
 * 全局搜索 API
 */

// 搜索结果项类型
export interface SearchResultItem {
	id: string;
	type: "trip" | "note" | "expense";
	[key: string]: unknown;
}

// 搜索建议项
export interface SuggestionItem {
	text: string;
	type: string;
}

// 搜索参数
export interface SearchParams {
	q: string;
	scope?: "all" | "trips" | "notes" | "expenses";
	sortBy?: "relevance" | "date" | "popularity";
	page?: number;
	pageSize?: number;
}

/**
 * 全局搜索
 */
export async function search(params: SearchParams): Promise<PaginatedData<SearchResultItem>> {
	const res = await api.get<ApiResponse<PaginatedData<SearchResultItem>>>("/search", { params });
	return res.data.data;
}

/**
 * 获取搜索建议
 */
export async function getSearchSuggestions(q: string): Promise<SuggestionItem[]> {
	const res = await api.get<ApiResponse<SuggestionItem[]>>("/search/suggestions", { params: { q } });
	return res.data.data;
}