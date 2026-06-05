import api from "./client";
import type { ApiResponse, CurrencyInfo } from "../types";

export interface RatesResponse {
  currencies: CurrencyInfo[];
  rates: Record<string, number>;
  base: string;
}

export async function getCurrencyRates(): Promise<RatesResponse> {
  const res = await api.get<ApiResponse<RatesResponse>>("/currency/rates");
  return res.data.data;
}