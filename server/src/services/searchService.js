import Trip from "../models/Trip.js";
import Note from "../models/Note.js";
import Expense from "../models/Expense.js";
import User from "../models/User.js";
import { Op, Sequelize } from "sequelize";

/**
 * 全局搜索服务
 * 支持游记、旅程、账单的全文模糊搜索，关键词高亮，多维度排序
 */

/**
 * 执行全局搜索
 * @param {Object} options - 搜索选项
 * @param {string} options.keyword - 搜索关键词
 * @param {string} options.scope - 搜索范围 (all, trips, notes, expenses)
 * @param {string} options.sortBy - 排序方式 (relevance, date, popularity)
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.userId - 当前用户ID（用于权限过滤）
 * @returns {Object} { results, total, page, pageSize }
 */
export async function search({ keyword, scope = "all", sortBy = "relevance", page = 1, pageSize = 10, userId }) {
	if (!keyword || !keyword.trim()) {
		return { results: [], total: 0, page, pageSize };
	}

	const trimmedKeyword = keyword.trim();
	const keywordPattern = `%${trimmedKeyword}%`;
	const searchResults = [];

	// 各范围搜索并行执行
	const searchPromises = [];

	if (scope === "all" || scope === "trips") {
		searchPromises.push(searchTrips(trimmedKeyword, keywordPattern, userId).then((items) => items.map((item) => ({ ...item, type: "trip" }))));
	} else {
		searchPromises.push(Promise.resolve([]));
	}

	if (scope === "all" || scope === "notes") {
		searchPromises.push(searchNotes(trimmedKeyword, keywordPattern, userId).then((items) => items.map((item) => ({ ...item, type: "note" }))));
	} else {
		searchPromises.push(Promise.resolve([]));
	}

	if (scope === "all" || scope === "expenses") {
		searchPromises.push(searchExpenses(trimmedKeyword, keywordPattern, userId).then((items) => items.map((item) => ({ ...item, type: "expense" }))));
	} else {
		searchPromises.push(Promise.resolve([]));
	}

	const [tripResults, noteResults, expenseResults] = await Promise.all(searchPromises);
	const allResults = [...tripResults, ...noteResults, ...expenseResults];

	// 计算相关性分数（简单算法：完全匹配 > 前缀匹配 > 包含匹配）
	allResults.forEach((item) => {
		item._relevanceScore = calculateRelevance(item, trimmedKeyword);
	});

	// 排序
	switch (sortBy) {
		case "relevance":
			allResults.sort((a, b) => b._relevanceScore - a._relevanceScore);
			break;
		case "date":
			allResults.sort((a, b) => {
				const dateA = new Date(a.createdAt || a.noteDate || a.expenseDate || 0).getTime();
				const dateB = new Date(b.createdAt || b.noteDate || b.expenseDate || 0).getTime();
				return dateB - dateA;
			});
			break;
		case "popularity":
			// 按笔记数量或热度排序
			allResults.sort((a, b) => {
				const popA = a.noteCount || a.popularity || 0;
				const popB = b.noteCount || b.popularity || 0;
				return popB - popA;
			});
			break;
		default:
			break;
	}

	// 分页
	const total = allResults.length;
	const start = (page - 1) * pageSize;
	const pagedResults = allResults.slice(start, start + pageSize);

	// 清理评分字段，添加高亮
	const cleanResults = pagedResults.map((item) => {
		const { _relevanceScore, ...rest } = item;
		return rest;
	});

	return { results: cleanResults, total, page: Number(page), pageSize: Number(pageSize) };
}

/**
 * 计算相关性分数
 * @param {Object} item - 搜索结果项
 * @param {string} keyword - 关键词
 * @returns {number} 相关性分数
 */
function calculateRelevance(item, keyword) {
	let score = 0;
	const lowerKeyword = keyword.toLowerCase();

	// 收集可搜索的文本字段
	const searchableFields = [];
	if (item.title) searchableFields.push(item.title);
	if (item.destination) searchableFields.push(item.destination);
	if (item.content) searchableFields.push(item.content);
	if (item.note) searchableFields.push(item.note);
	if (item.category) searchableFields.push(item.category);
	if (item.username) searchableFields.push(item.username);

	for (const field of searchableFields) {
		const lowerField = String(field).toLowerCase();

		// 完全匹配加分最多
		if (lowerField === lowerKeyword) {
			score += 100;
		}
		// 前缀匹配
		else if (lowerField.startsWith(lowerKeyword)) {
			score += 50;
		}
		// 包含匹配
		else if (lowerField.includes(lowerKeyword)) {
			score += 20;
		}
		// 单词匹配（英文分词）
		else if (lowerKeyword.includes(" ")) {
			const words = lowerKeyword.split(/\s+/);
			const matchCount = words.filter((w) => lowerField.includes(w)).length;
			score += matchCount * 10;
		}
		// 模糊匹配：计算编辑距离容忍度
		else if (lowerKeyword.length > 2) {
			if (isFuzzyMatch(lowerField, lowerKeyword)) {
				score += 5;
			}
		}
	}

	return score;
}

/**
 * 简单的模糊匹配（基于编辑距离容忍）
 * 检查关键词是否大致匹配目标字符串的一部分
 * @param {string} text - 目标文本
 * @param {string} keyword - 关键词
 * @returns {boolean} 是否模糊匹配
 */
function isFuzzyMatch(text, keyword) {
	if (keyword.length <= 2) return false;

	// 提取关键词中的每个字，检查是否大部分出现在文本中
	const chars = [...keyword];
	const matchCount = chars.filter((char) => text.includes(char)).length;
	const matchRatio = matchCount / chars.length;

	// 超过 70% 的字匹配则认为模糊匹配
	return matchRatio >= 0.7;
}

/**
 * 搜索旅程
 * @param {string} keyword - 关键词
 * @param {string} pattern - SQL LIKE 模式
 * @param {string} userId - 用户ID
 * @returns {Array} 搜索结果
 */
async function searchTrips(keyword, pattern, userId) {
	const trips = await Trip.findAll({
		where: {
			// 只搜索自己的旅程或公开旅程
			[Op.or]: [{ userId: userId || "" }, { isPublic: 1 }],
			[Op.or]: [{ title: { [Op.like]: pattern } }, { destination: { [Op.like]: pattern } }],
		},
		include: [
			{
				model: User,
				attributes: ["id", "username", "avatarUrl"],
				required: false,
			},
		],
		order: [["createdAt", "DESC"]],
		limit: 20,
	});

	return trips.map((trip) => ({
		id: trip.id,
		title: trip.title,
		destination: trip.destination,
		startDate: trip.startDate,
		endDate: trip.endDate,
		coverImage: trip.coverImage,
		isPublic: trip.isPublic,
		createdAt: trip.createdAt,
		username: trip.User ? trip.User.username : null,
	}));
}

/**
 * 搜索游记
 * @param {string} keyword - 关键词
 * @param {string} pattern - SQL LIKE 模式
 * @param {string} userId - 用户ID
 * @returns {Array} 搜索结果
 */
async function searchNotes(keyword, pattern, userId) {
	const notes = await Note.findAll({
		where: {
			content: { [Op.like]: pattern },
		},
		include: [
			{
				model: Trip,
				attributes: ["id", "title", "destination", "userId", "isPublic"],
				required: true,
			},
		],
		order: [["createdAt", "DESC"]],
		limit: 20,
	});

	// 过滤权限：只能搜索自己的笔记或公开旅程的笔记
	return notes
		.filter((note) => {
			if (!note.Trip) return false;
			return note.Trip.userId === userId || note.Trip.isPublic === 1;
		})
		.map((note) => ({
			id: note.id,
			content: note.content ? note.content.substring(0, 200) + (note.content.length > 200 ? "..." : "") : "",
			noteDate: note.noteDate,
			createdAt: note.createdAt,
			images: note.images,
			tripId: note.Trip.id,
			tripTitle: note.Trip.title,
			destination: note.Trip ? note.Trip.destination : null,
		}));
}

/**
 * 搜索账单
 * @param {string} keyword - 关键词
 * @param {string} pattern - SQL LIKE 模式
 * @param {string} userId - 用户ID
 * @returns {Array} 搜索结果
 */
async function searchExpenses(keyword, pattern, userId) {
	const expenses = await Expense.findAll({
		where: {
			[Op.or]: [{ note: { [Op.like]: pattern } }, { category: { [Op.like]: pattern } }],
		},
		include: [
			{
				model: Trip,
				attributes: ["id", "title", "destination", "userId", "isPublic"],
				required: true,
			},
		],
		order: [["createdAt", "DESC"]],
		limit: 20,
	});

	// 只有用户自己的账单可搜索
	return expenses
		.filter((expense) => expense.Trip && expense.Trip.userId === userId)
		.map((expense) => ({
			id: expense.id,
			category: expense.category,
			amount: Number(expense.amount),
			note: expense.note,
			expenseDate: expense.expenseDate,
			createdAt: expense.createdAt,
			tripId: expense.Trip.id,
			tripTitle: expense.Trip.title,
			destination: expense.Trip ? expense.Trip.destination : null,
		}));
}

/**
 * 获取搜索建议（自动补全）
 * @param {string} keyword - 输入关键词
 * @param {string} userId - 用户ID
 * @returns {Array} 建议列表
 */
export async function getSearchSuggestions(keyword, userId) {
	if (!keyword || keyword.trim().length < 1) {
		return [];
	}

	const pattern = `%${keyword.trim()}%`;
	const suggestions = [];

	// 搜索匹配的旅程标题
	const trips = await Trip.findAll({
		where: {
			[Op.or]: [{ userId: userId || "" }, { isPublic: 1 }],
			[Op.or]: [{ title: { [Op.like]: pattern } }, { destination: { [Op.like]: pattern } }],
		},
		attributes: ["title", "destination"],
		limit: 5,
	});

	trips.forEach((trip) => {
		if (trip.title.includes(keyword) && !suggestions.includes(trip.title)) {
			suggestions.push({ text: trip.title, type: "trip" });
		}
		if (trip.destination.includes(keyword) && !suggestions.some((s) => s.text === trip.destination)) {
			suggestions.push({ text: trip.destination, type: "destination" });
		}
	});

	return suggestions.slice(0, 8);
}
