import { search, getSearchSuggestions } from "../services/searchService.js";

/**
 * 全局搜索
 * GET /api/search?q=关键词&scope=all&sortBy=relevance&page=1&pageSize=10
 */
export async function globalSearch(req, res, next) {
	try {
		const { q, scope = "all", sortBy = "relevance", page = 1, pageSize = 10 } = req.query;
		const userId = req.userId || null;

		if (!q || !q.trim()) {
			return res.json({
				success: true,
				data: { list: [], total: 0, page: 1, pageSize: Number(pageSize) },
			});
		}

		const result = await search({
			keyword: q,
			scope,
			sortBy,
			page: Number(page),
			pageSize: Number(pageSize),
			userId,
		});

		res.json({
			success: true,
			data: {
				list: result.results,
				total: result.total,
				page: result.page,
				pageSize: result.pageSize,
			},
		});
	} catch (error) {
		next(error);
	}
}

/**
 * 搜索建议
 * GET /api/search/suggestions?q=关键词
 */
export async function getSuggestions(req, res, next) {
	try {
		const { q } = req.query;
		const userId = req.userId || null;

		const suggestions = await getSearchSuggestions(q, userId);

		res.json({
			success: true,
			data: suggestions,
		});
	} catch (error) {
		next(error);
	}
}
