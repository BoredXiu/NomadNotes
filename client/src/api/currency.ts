import api from "./client";
import type { ApiResponse, CurrencyInfo } from "../types";

/**
 * 多币种支持 API
 */

// 汇率响应
export interface RatesResponse {
	currencies: CurrencyInfo[];
	rates: Record<string, number>;
	base: string;
}

// 转换请求
export interface ConvertRequest {
	amount: number;
	from?: string;
	to: string;
}

// 转换响应
export interface ConvertResponse {
	originalAmount: number;
	fromCurrency: string;
	toCurrency: string;
	convertedAmount: number;
}

/**
 * 获取支持的货币和当前汇率
 */
export async function getCurrencyRates(): Promise<RatesResponse> {
	const res = await api.get<ApiResponse<RatesResponse>>("/currency/rates");
	return res.data.data;
}

/**
 * 强制刷新汇率
 */
export async function refreshCurrencyRates(): Promise<RatesResponse> {
	const res = await api.post<ApiResponse<RatesResponse>>("/currency/refresh");
	return res.data.data;
}

/**
 * 货币转换
 */
export async function convertCurrency(data: ConvertRequest): Promise<ConvertResponse> {
	const res = await api.post<ApiResponse<ConvertResponse>>("/currency/convert", data);
	return res.data.data;
}