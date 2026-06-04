import Note from "../models/Note.js";
import Trip from "../models/Trip.js";
import { AppError } from "../utils/AppError.js";

/**
 * 游记导出服务
 * 支持 PDF、HTML、Markdown 三种格式导出
 */

/**
 * 生成 HTML 格式的游记内容
 * @param {Object} trip - 旅程信息
 * @param {Array} notes - 游记列表
 * @returns {string} HTML 字符串
 */
function buildHTML(trip, notes) {
	const notesHTML = notes
		.map(
			(note) => `
    <div class="note-entry">
      <h3>${escapeHtml(note.noteDate)}</h3>
      <div class="note-content">${formatContentToHTML(note.content)}</div>
      ${buildImagesHTML(note.images)}
    </div>
  `,
		)
		.join("");

	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(trip.title)} - 游记</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif; color: #333; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; border-bottom: 2px solid #667eea; padding-bottom: 24px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 8px; }
    .header .meta { font-size: 14px; color: #888; }
    .note-entry { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px dashed #e8e8e8; }
    .note-entry h3 { font-size: 18px; color: #667eea; margin-bottom: 12px; }
    .note-content { font-size: 15px; white-space: pre-wrap; word-break: break-word; }
    .note-content p { margin-bottom: 8px; }
    .images { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
    .images img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .footer { text-align: center; padding: 24px 0; color: #aaa; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(trip.title)}</h1>
    <div class="meta">
      目的地: ${escapeHtml(trip.destination)} | 
      日期: ${escapeHtml(trip.startDate)} ~ ${escapeHtml(trip.endDate)}
    </div>
  </div>
  ${notesHTML}
  <div class="footer">
    <p>由 NomadNotes 游迹 导出</p>
  </div>
</body>
</html>`;
}

/**
 * 生成 Markdown 格式的游记内容
 * @param {Object} trip - 旅程信息
 * @param {Array} notes - 游记列表
 * @returns {string} Markdown 字符串
 */
function buildMarkdown(trip, notes) {
	const notesMD = notes
		.map((note) => {
			let md = `### ${note.noteDate}\n\n${note.content}\n\n`;
			if (note.images && note.images.length > 0) {
				note.images.forEach((img) => {
					md += `![图片](${img})\n\n`;
				});
			}
			return md;
		})
		.join("---\n\n");

	return `# ${trip.title}

> 目的地: ${trip.destination}  
> 日期: ${trip.startDate} ~ ${trip.endDate}

---

${notesMD}

---

*由 NomadNotes 游迹 导出*
`;
}

/**
 * 生成 PDF 格式的游记内容（返回 HTML，后续由前端/pdfkit 转换）
 * PDF 通过 HTML 渲染，便于保持排版一致性
 * @param {Object} trip - 旅程信息
 * @param {Array} notes - 游记列表
 * @returns {string} HTML 字符串
 */
function buildPDFContent(trip, notes) {
	return buildHTML(trip, notes);
}

/**
 * 将纯文本内容转为 HTML 格式（保留换行和段落）
 * @param {string} content - 原始文本
 * @returns {string} HTML 字符串
 */
function formatContentToHTML(content) {
	if (!content) return "";
	const escaped = escapeHtml(content);
	return escaped
		.split(/\n\n+/)
		.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
		.join("");
}

/**
 * 生成图片 HTML 片段
 * @param {Array|null} images - 图片路径数组
 * @returns {string} HTML 字符串
 */
function buildImagesHTML(images) {
	if (!images || images.length === 0) return "";
	const imgs = images.map((src) => `<img src="${escapeHtml(src)}" alt="游记图片" />`).join("");
	return `<div class="images">${imgs}</div>`;
}

/**
 * HTML 实体转义
 * @param {string} str - 原始字符串
 * @returns {string} 转义后字符串
 */
function escapeHtml(str) {
	if (!str) return "";
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * 生成导出文件名
 * @param {Object} trip - 旅程信息
 * @param {string} format - 导出格式
 * @returns {string} 文件名
 */
function generateFilename(trip, format) {
	const extMap = { html: "html", markdown: "md", pdf: "html" };
	const ext = extMap[format] || format;
	const title = (trip.title || "游记").replace(/[\\/:*?"<>|]/g, "_");
	const date = new Date().toISOString().slice(0, 10);
	return `${title}_${date}.${ext}`;
}

/**
 * 导出游记
 * @param {string} tripId - 旅程ID
 * @param {string} userId - 用户ID
 * @param {string} format - 导出格式 (html, markdown, pdf)
 * @param {Array<string>|null} noteIds - 指定导出的游记ID列表，null 表示全部
 * @returns {Object} { content, filename, format }
 */
export async function exportNotes(tripId, userId, format = "html", noteIds = null) {
	const trip = await Trip.findOne({ where: { id: tripId } });
	if (!trip) {
		throw new AppError("旅程不存在", 404);
	}
	if (trip.userId !== userId) {
		throw new AppError("无权导出该旅程游记", 403);
	}

	// 查询游记
	const whereClause = { tripId };
	if (noteIds && noteIds.length > 0) {
		whereClause.id = noteIds;
	}

	const notes = await Note.findAll({
		where: whereClause,
		order: [["noteDate", "ASC"]],
	});

	if (notes.length === 0) {
		throw new AppError("没有可导出的游记内容", 400);
	}

	let content;
	switch (format) {
		case "html":
		case "pdf":
			content = buildHTML(trip, notes);
			break;
		case "markdown":
			content = buildMarkdown(trip, notes);
			break;
		default:
			throw new AppError(`不支持的导出格式: ${format}`, 400);
	}

	const filename = generateFilename(trip, format);

	return { content, filename, format };
}