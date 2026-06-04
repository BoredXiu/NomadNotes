import { create } from "zustand";

/**
 * 多币种状态管理 Store
 * 管理当前选择的货币和汇率缓存
 */

// 默认币种：人民币
const DEFAULT_CURRENCY = "CNY";

// 从 localStorage 读取用户偏好货币
function loadInitialCurrency(): string {
	try {
		const saved = localStorage.getItem("preferredCurrency");
		if (saved) return saved;
	} catch {
		// 忽略
	}
	return DEFAULT_CURRENCY;
}

// 从 localStorage 读取缓存的汇率
function loadCachedRates(): Record<string, number> | null {
	try {
		const saved = localStorage.getItem("currencyRates");
		const timestamp = localStorage.getItem("currencyRatesTimestamp");
		if (saved && timestamp) {
			const age = Date.now() - Number(timestamp);
			// 缓存超过1小时则失效
			if (age < 60 * 60 * 1000) {
				return JSON.parse(saved);
			}
		}
	} catch {
		// 忽略
	}
	return null;
}

interface CurrencyState {
	// 当前选择的货币代码
	currency: string;

	// 汇率数据（以 CNY 为基准）
	rates: Record<string, number>;

	// 是否正在加载汇率
	loading: boolean;

	// 设置当前货币
	setCurrency: (code: string) => void;

	// 设置汇率数据
	setRates: (rates: Record<string, number>) => void;

	// 设置加载状态
	setLoading: (loading: boolean) => void;

	// 获取货币符号
	getCurrencySymbol: (code?: string) => string;

	// 转换金额
	convertAmount: (amount: number, fromCurrency?: string) => number;
}

// 货币符号映射
const SYMBOL_MAP: Record<string, string> = {
	CNY: "¥",
	USD: "$",
	EUR: "€",
	GBP: "£",
	JPY: "¥",
	AUD: "A$",
};

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
	currency: loadInitialCurrency(),
	rates: loadCachedRates() || { CNY: 1 },
	loading: false,

	setCurrency: (code: string) => {
		localStorage.setItem("preferredCurrency", code);
		set({ currency: code });
	},

	setRates: (rates: Record<string, number>) => {
		localStorage.setItem("currencyRates", JSON.stringify(rates));
		localStorage.setItem("currencyRatesTimestamp", String(Date.now()));
		set({ rates });
	},

	setLoading: (loading: boolean) => {
		set({ loading });
	},

	getCurrencySymbol: (code?: string) => {
		const c = code || get().currency;
		return SYMBOL_MAP[c] || c;
	},

	convertAmount: (amount: number, fromCurrency = "CNY") => {
		const { currency, rates } = get();
		if (currency === fromCurrency) return amount;
		if (!rates[fromCurrency] || !rates[currency]) return amount;

		// 以 CNY 为基准转换
		const amountInCNY = amount / rates[fromCurrency];
		const converted = amountInCNY * rates[currency];

		// 日元保留整数，其他保留2位小数
		if (currency === "JPY") return Math.round(converted);
		return Math.round(converted * 100) / 100;
	},
}));