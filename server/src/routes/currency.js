import { Router } from "express";
import * as currencyController from "../controllers/currencyController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// 获取支持的货币和当前汇率
router.get("/rates", auth, currencyController.getCurrencyRates);

// 强制刷新汇率
router.post("/refresh", auth, currencyController.refreshCurrencyRates);

// 货币转换
router.post("/convert", auth, currencyController.convertAmount);

export default router;