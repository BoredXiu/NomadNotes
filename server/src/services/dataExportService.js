import Expense from "../models/Expense.js";
import Note from "../models/Note.js";
import Trip from "../models/Trip.js";
import { AppError } from "../utils/AppError.js";

/**
 * 数据导出服务
 * 导出 JSON 格式的账单和游记数据，包含元数据信息
 * 导出范围：仅账单 (expenses) 和游记 (notes)，不包含敏感用户数据
 */

const DATA_VERSION = "1.0.0";

/**
 * 导出单次旅程的全部数据
 * @param {string} tripId - 旅程 ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @returns {object} JSON 导出数据结构
 */
export async function exportTripData(tripId, userId) {
    // 验证旅程所有权
    const trip = await Trip.findOne({ where: { id: tripId } });
    if (!trip) {
        throw new AppError("旅程不存在", 404);
    }
    if (trip.userId !== userId) {
        throw new AppError("无权导出该旅程数据", 403);
    }

    // 并行查询账单和游记
    const [expenses, notes] = await Promise.all([
        Expense.findAll({
            where: { tripId },
            order: [["expenseDate", "ASC"]],
            attributes: [
                "id",
                "category",
                "amount",
                "note",
                "expenseDate",
                "createdAt",
            ],
        }),
        Note.findAll({
            where: { tripId },
            order: [["noteDate", "ASC"]],
            attributes: [
                "id",
                "content",
                "noteDate",
                "createdAt",
            ],
        }),
    ]);

    // 构建导出数据（不含敏感信息）
    const exportData = {
        _metadata: {
            version: DATA_VERSION,
            exportedAt: new Date().toISOString(),
            tripId: trip.id,
            tripTitle: trip.title,
            tripDestination: trip.destination,
            tripDateRange: {
                startDate: trip.startDate,
                endDate: trip.endDate,
            },
            recordCount: {
                expenses: expenses.length,
                notes: notes.length,
                total: expenses.length + notes.length,
            },
        },
        trip: {
            title: trip.title,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
        },
        expenses: expenses.map((e) => ({
            id: e.id,
            category: e.category,
            amount: parseFloat(e.amount),
            note: e.note || "",
            expenseDate: e.expenseDate,
            createdAt: e.createdAt,
        })),
        notes: notes.map((n) => ({
            id: n.id,
            content: n.content,
            noteDate: n.noteDate,
            createdAt: n.createdAt,
        })),
    };

    return exportData;
}

/**
 * 统计数据总数（用于导出预估）
 * @param {string} tripId - 旅程 ID
 * @returns {object} { expenseCount, noteCount, totalCount }
 */
export async function getExportCount(tripId) {
    const [expenseCount, noteCount] = await Promise.all([
        Expense.count({ where: { tripId } }),
        Note.count({ where: { tripId } }),
    ]);

    return {
        expenseCount,
        noteCount,
        totalCount: expenseCount + noteCount,
    };
}