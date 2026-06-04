import { Router } from "express";
import * as searchController from "../controllers/searchController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// 全局搜索
router.get("/", optionalAuth, searchController.globalSearch);

// 搜索建议
router.get("/suggestions", optionalAuth, searchController.getSuggestions);

export default router;