import { exportTripData, getExportCount } from "../services/dataExportService.js";

/**
 * 导出旅程数据（JSON 格式）
 * GET /api/trips/:tripId/export
 */
export async function exportTripDataJson(req, res, next) {
    try {
        const { tripId } = req.params;
        const userId = req.userId;

        const data = await exportTripData(tripId, userId);

        // 生成文件名：旅程标题_导出时间.json
        const safeTitle = (data.trip.title || "export")
            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, "_");
        const filename = `${safeTitle}_${new Date().toISOString().slice(0, 10)}.json`;

        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(filename)}"`,
        );
        // 美化输出 JSON
        res.json(data);
    } catch (error) {
        next(error);
    }
}

/**
 * 获取导出数据统计（用于预览导出范围）
 * GET /api/trips/:tripId/export/count
 */
export async function getExportDataCount(req, res, next) {
    try {
        const { tripId } = req.params;

        const count = await getExportCount(tripId);

        res.json({
            success: true,
            data: count,
        });
    } catch (error) {
        next(error);
    }
}