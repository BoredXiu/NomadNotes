import {
	getRates,
	refreshRates,
	convertCurrency,
	getSupportedCurrencies,
} from "../services/currencyService.js";

/**
 * 获取支持的货币列表和当前汇率
 * GET /api/currency/rates
 */
export async function getCurrencyRates(req, res, next) {
	try {
		const rates = await getRates();
		const currencies = getSupportedCurrencies();

		res.json({
			success: true,
			data: {
				currencies,
				rates,
				base: "CNY",
			},
		});
	} catch (error) {
		next(error);
	}
}

/**
 * 强制刷新汇率
 * POST /api/currency/refresh
 */
export async function refreshCurrencyRates(req, res, next) {
	try {
		const rates = await refreshRates();

		res.json({
			success: true,
			data: {
				rates,
				base: "CNY",
				message: "汇率已刷新",
			},
		});
	} catch (error) {
		next(error);
	}
}

/**
 * 货币转换
 * POST /api/currency/convert
 * Body: { amount, from, to }
 */
export async function convertAmount(req, res, next) {
	try {
		const { amount, from = "CNY", to } = req.body;

		if (!amount || !to) {
			return res.status(400).json({
				success: false,
				message: "请提供金额和目标货币",
			});
		}

		if (typeof amount !== "number" || amount < 0) {
			return res.status(400).json({
				success: false,
				message: "金额必须为非负数字",
			});
		}

		const result = await convertCurrency(amount, from, to);

		res.json({
			success: true,
			data: {
				originalAmount: amount,
				fromCurrency: from,
				toCurrency: to,
				convertedAmount: result,
			},
		});
	} catch (error) {
		next(error);
	}
}