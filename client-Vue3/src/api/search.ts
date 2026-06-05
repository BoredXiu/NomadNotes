import api from "./client";
import type { ApiResponse, PaginatedData, SearchResultItem } from "../types";

export interface SuggestionItem {
  text: string;
  type: string;
}

export interface SearchParams {
  q: string;
  scope?: "all" | "trips" | "notes" | "expenses";
  sortBy?: "relevance" | "date" | "popularity";
  page?: number;
  pageSize?: number;
}

export async function getSearchSuggestions(
  query: string,
): Promise<SuggestionItem[]> {
  const res = await api.get<ApiResponse<SuggestionItem[]>>("/search/suggest", {
    params: { q: query },
  });
  return res.data.data;
}

export async function search(params: SearchParams): Promise<PaginatedData<SearchResultItem>> {
  const res = await api.get<ApiResponse<PaginatedData<SearchResultItem>>>("/search", { params });
  return res.data.data;
}