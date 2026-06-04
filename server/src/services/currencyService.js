import { AppError } from "../utils/AppError.js";

/**
 * 多币种支持服务
 * 提供实时汇率获取、缓存和货币转换功能
 */

// 支持的货币列表
export const SUPPORTED_CURRENCIES = [
	{ code: "CNY", symbol: "¥", name: "人民币" },
	{ code: "USD", symbol: "$", name: "美元" },
	{ code: "EUR", symbol: "€", name: "欧元" },
	{ code: "GBP", symbol: "£", name: "英镑" },
	{ code: "JPY", symbol: "¥", name: "日元" },
	{ code: "AUD", symbol: "A$", name: "澳元" },
];

// 汇率缓存
let ratesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

// 默认汇率（离线/API不可用时的后备数据，以CNY为基准）
const DEFAULT_RATES = {
	CNY: 1,
	USD: 0.14,
	EUR: 0.13,
	GBP: 0.11,
	JPY: 20.5,
	AUD: 0.21,
};

/**
 * 从 API 获取实时汇率数据
 * 使用免费汇率 API（frankfurter.app），以 EUR 为基准
 * @returns {Object} 汇率数据，以 CNY 为基准
 */
async function fetchRatesFromAPI() {
	try {
		// 使用 exchangerate-api 免费接口
		const response = await fetch(
			"https://api.exchangerate-api.com/v4/latest/CNY",
		);
		if (!response.ok) {
			throw new Error(`API 返回状态码: ${response.status}`);
		}
		const data = await response.json();

		// 提取需要的货币汇率
		const rates = {};
		for (const currency of SUPPORTED_CURRENCIES) {
			if (data.rates[currency.code] !== undefined) {
				rates[currency.code] = data.rates[currency.code];
			}
		}

		return rates;
	} catch (error) {
		console.warn("[CURRENCY] 汇率API获取失败，使用默认汇率:", error.message);
		return null;
	}
}

/**
 * 获取汇率数据（带缓存）
 * 优先返回缓存，过期则重新获取
 * @returns {Object} 汇率数据
 */
export async function getRates() {
	const now = Date.now();

	// 缓存有效期内直接返回
	if (ratesCache && cacheTimestamp && now - cacheTimestamp < CACHE_TTL) {
		return ratesCache;
	}

	// 尝试从API获取最新汇率
	const freshRates = await fetchRatesFromAPI();
	if (freshRates) {
		ratesCache = freshRates;
		cacheTimestamp = now;
		return freshRates;
	}

	// API获取失败，使用缓存（即使过期）或默认汇率
	if (ratesCache) {
		return ratesCache;
	}

	ratesCache = { ...DEFAULT_RATES };
	cacheTimestamp = now;
	return ratesCache;
}

/**
 * 强制刷新汇率缓存
 * @returns {Object} 最新汇率数据
 */
export async function refreshRates() {
	ratesCache = null;
	cacheTimestamp = null;
	return getRates();
}

/**
 * 货币转换
 * @param {number} amount - 原始金额
 * @param {string} from - 原始货币代码
 * @param {string} to - 目标货币代码
 * @returns {number} 转换后金额（保留2位小数）
 */
export async function convertCurrency(amount, from, to) {
	if (from === to) {
		return amount;
	}

	const rates = await getRates();

	if (!rates[from]) {
		throw new AppError(`不支持的货币: ${from}`, 400);
	}
	if (!rates[to]) {
		throw new AppError(`不支持的货币: ${to}`, 400);
	}

	// 以CNY为基准进行转换: amount / rate[from] * rate[to]
	const amountInCNY = amount / rates[from];
	const converted = amountInCNY * rates[to];

	return Math.round(converted * 100) / 100;
}

/**
 * 获取支持货币列表
 * @returns {Array} 货币配置列表
 */
export function getSupportedCurrencies() {
	return SUPPORTED_CURRENCIES;
}