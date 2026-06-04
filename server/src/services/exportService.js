import Note from "../models/Note.js";
import Expense from "../models/Expense.js";
import Trip from "../models/Trip.js";
import { AppError } from "../utils/AppError.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 游记导出服务
 * 支持 PDF、HTML、Markdown 三种格式导出
 * 导出内容包含：概览、账单、统计、游记 四大模块
 */

/**
 * 将本地图片文件转为 base64 data URI
 * @param {string} imagePath - 图片路径（相对路径如 /uploads/images/xxx.jpg）
 * @returns {string} base64 data URI，失败则返回原始路径
 */
function imageToBase64(imagePath) {
	if (!imagePath) return "";
	try {
		// 处理相对路径，去掉开头的 /
		const relativePath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
		const fullPath = path.join(__dirname, "..", "..", relativePath);
		if (!fs.existsSync(fullPath)) {
			// 尝试作为绝对 URL 处理（外部图片）
			return imagePath;
		}
		const ext = path.extname(fullPath).toLowerCase();
		const mimeMap = {
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".png": "image/png",
			".gif": "image/gif",
			".webp": "image/webp",
			".svg": "image/svg+xml",
		};
		const mime = mimeMap[ext] || "image/jpeg";
		const buffer = fs.readFileSync(fullPath);
		const base64 = buffer.toString("base64");
		return `data:${mime};base64,${base64}`;
	} catch {
		// 转换失败返回原始路径
		return imagePath;
	}
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
	if (!date) return "";
	const d = new Date(date);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

/**
 * 构建账单表格 HTML
 * @param {Array} expenses - 账单列表
 * @returns {string} HTML 字符串
 */
function buildExpensesHTML(expenses) {
	if (!expenses || expenses.length === 0) {
		return '<p style="color: #999; text-align: center;">暂无账单记录</p>';
	}

	const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

	const rows = expenses
		.map(
			(e) => `
    <tr>
      <td>${formatDate(e.expenseDate)}</td>
      <td><span class="tag">${escapeHtml(e.category)}</span></td>
      <td style="text-align: right; color: #ff4d4f;">&yen;${parseFloat(e.amount || 0).toFixed(2)}</td>
      <td>${escapeHtml(e.note || "-")}</td>
    </tr>`,
		)
		.join("");

	return `
  <div class="section">
    <h2 class="section-title">账单明细</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>日期</th>
          <th>分类</th>
          <th>金额</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2"><strong>合计</strong></td>
          <td colspan="2" style="text-align: right; color: #ff4d4f; font-weight: bold;">
            &yen;${total.toFixed(2)}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>`;
}

/**
 * 构建统计信息 HTML
 * @param {Array} expenses - 账单列表
 * @param {Array} notes - 游记列表
 * @returns {string} HTML 字符串
 */
function buildStatsHTML(expenses, notes) {
	const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
	const dates = new Set(expenses.map((e) => formatDate(e.expenseDate)));
	const avgPerDay = dates.size > 0 ? total / dates.size : 0;

	// 分类统计
	const categoryMap = {};
	for (const e of expenses) {
		if (!categoryMap[e.category]) {
			categoryMap[e.category] = { total: 0, count: 0 };
		}
		categoryMap[e.category].total += parseFloat(e.amount || 0);
		categoryMap[e.category].count += 1;
	}

	let maxCategory = { name: "暂无", amount: 0 };
	for (const [cat, data] of Object.entries(categoryMap)) {
		if (data.total > maxCategory.amount) {
			maxCategory = { name: cat, amount: data.total };
		}
	}

	// 游记图片统计
	let totalImages = 0;
	for (const n of notes) {
		totalImages += n.images?.length || 0;
	}

	let html = `
  <div class="section">
    <h2 class="section-title">消费统计</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${total > 0 ? "&yen;" + total.toFixed(2) : "0.00"}</div>
        <div class="stat-label">总支出</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgPerDay > 0 ? "&yen;" + avgPerDay.toFixed(2) : "0.00"}</div>
        <div class="stat-label">日均支出</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${expenses.length}</div>
        <div class="stat-label">消费笔数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${maxCategory.name}</div>
        <div class="stat-label">最高消费类别</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${notes.length}</div>
        <div class="stat-label">游记篇数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalImages}</div>
        <div class="stat-label">游记图片数</div>
      </div>
    </div>`;

	// 分类明细
	if (Object.keys(categoryMap).length > 0) {
		const categoryRows = Object.entries(categoryMap)
			.sort((a, b) => b[1].total - a[1].total)
			.map(
				([cat, data]) => `
    <tr>
      <td><span class="tag">${escapeHtml(cat)}</span></td>
      <td>${data.count} 笔</td>
      <td style="text-align: right; color: #ff4d4f;">&yen;${data.total.toFixed(2)}</td>
      <td style="text-align: right;">${total > 0 ? ((data.total / total) * 100).toFixed(1) : 0}%</td>
    </tr>`,
			)
			.join("");

		html += `
    <h3 style="margin-top: 24px;">分类明细</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th>分类</th>
          <th>笔数</th>
          <th>金额</th>
          <th>占比</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRows}
      </tbody>
    </table>`;
	}

	html += `
  </div>`;

	return html;
}

/**
 * 构建概览 HTML
 * @param {Object} trip - 旅程信息
 * @param {number} expenseCount - 账单数
 * @param {number} noteCount - 游记数
 * @returns {string} HTML 字符串
 */
function buildOverviewHTML(trip, expenseCount, noteCount) {
	const statusText = trip.isEnded === 1 ? "已结束" : "进行中";
	const statusColor = trip.isEnded === 1 ? "#1890ff" : "#52c41a";

	return `
  <div class="section">
    <h2 class="section-title">旅程概览</h2>
    <div class="overview-grid">
      <div class="overview-item">
        <span class="overview-label">目的地</span>
        <span class="overview-value">${escapeHtml(trip.destination)}</span>
      </div>
      <div class="overview-item">
        <span class="overview-label">开始日期</span>
        <span class="overview-value">${formatDate(trip.startDate)}</span>
      </div>
      <div class="overview-item">
        <span class="overview-label">结束日期</span>
        <span class="overview-value">${formatDate(trip.endDate)}</span>
      </div>
      <div class="overview-item">
        <span class="overview-label">状态</span>
        <span class="overview-value" style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
      </div>
      <div class="overview-item">
        <span class="overview-label">账单数</span>
        <span class="overview-value">${expenseCount} 条</span>
      </div>
      <div class="overview-item">
        <span class="overview-label">游记数</span>
        <span class="overview-value">${noteCount} 篇</span>
      </div>
    </div>
  </div>`;
}

/**
 * 生成游记 HTML 片段（含 base64 嵌入图片）
 * @param {Array} notes - 游记列表
 * @returns {string} HTML 字符串
 */
function buildNotesHTML(notes) {
	if (!notes || notes.length === 0) {
		return '<p style="color: #999; text-align: center;">暂无游记内容</p>';
	}

	const entries = notes
		.map((note) => {
			let imagesHTML = "";
			if (note.images && note.images.length > 0) {
				const imgs = note.images
					.map((src) => {
						const base64 = imageToBase64(src);
						return `<img src="${base64}" alt="游记图片" />`;
					})
					.join("");
				imagesHTML = `<div class="images">${imgs}</div>`;
			}

			return `
    <div class="note-entry">
      <h3>${formatDate(note.noteDate)}</h3>
      <div class="note-content">${formatContentToHTML(note.content)}</div>
      ${imagesHTML}
    </div>`;
		})
		.join("");

	return entries;
}

/**
 * 生成完整的 HTML 导出内容
 * @param {Object} trip - 旅程信息
 * @param {Array} notes - 游记列表
 * @param {Array} expenses - 账单列表
 * @returns {string} HTML 字符串
 */
function buildHTML(trip, notes, expenses) {
	const expenseCount = expenses.length;
	const noteCount = notes.length;

	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(trip.title)} - 旅程报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif;
      color: #333;
      line-height: 1.8;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #667eea;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .header h1 { font-size: 32px; color: #1a1a1a; margin-bottom: 12px; }
    .header .meta { font-size: 14px; color: #888; }
    .header .meta span { margin: 0 8px; }

    .section { margin-bottom: 40px; }
    .section-title {
      font-size: 22px;
      color: #667eea;
      border-left: 4px solid #667eea;
      padding-left: 12px;
      margin-bottom: 20px;
    }

    /* 概览 */
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
    }
    .overview-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #e8e8e8;
    }
    .overview-item:last-child { border-bottom: none; }
    .overview-label { color: #888; font-size: 14px; }
    .overview-value { font-weight: 500; }

    /* 统计 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .stat-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-value { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
    .stat-label { font-size: 13px; color: #888; }

    /* 表格 */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .data-table th {
      background: #f5f5f5;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e8e8e8;
    }
    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
    }
    .data-table tfoot td {
      background: #fafafa;
      font-weight: bold;
    }
    .tag {
      display: inline-block;
      padding: 2px 8px;
      background: #e6f7ff;
      color: #1890ff;
      border-radius: 4px;
      font-size: 12px;
    }

    /* 游记 */
    .note-entry {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px dashed #e8e8e8;
    }
    .note-entry:last-child { border-bottom: none; }
    .note-entry h3 {
      font-size: 18px;
      color: #667eea;
      margin-bottom: 12px;
    }
    .note-content {
      font-size: 15px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .note-content p { margin-bottom: 8px; }
    .images {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
    }
    .images img {
      max-width: 280px;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .footer {
      text-align: center;
      padding: 32px 0 16px;
      color: #aaa;
      font-size: 12px;
      border-top: 1px solid #f0f0f0;
      margin-top: 40px;
    }

    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(trip.title)}</h1>
    <div class="meta">
      <span>目的地: ${escapeHtml(trip.destination)}</span>
      <span>|</span>
      <span>${formatDate(trip.startDate)} ~ ${formatDate(trip.endDate)}</span>
    </div>
  </div>

  ${buildOverviewHTML(trip, expenseCount, noteCount)}

  ${buildStatsHTML(expenses, notes)}

  ${buildExpensesHTML(expenses)}

  <div class="section">
    <h2 class="section-title">游记</h2>
    ${buildNotesHTML(notes)}
  </div>

  <div class="footer">
    <p>由 NomadNotes 游迹 导出 &mdash; ${new Date().toISOString().slice(0, 10)}</p>
  </div>
</body>
</html>`;
}

/**
 * 生成 Markdown 格式的完整导出内容
 * @param {Object} trip - 旅程信息
 * @param {Array} notes - 游记列表
 * @param {Array} expenses - 账单列表
 * @returns {string} Markdown 字符串
 */
function buildMarkdown(trip, notes, expenses) {
	const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

	// 概览
	const overview = `## 旅程概览

| 项目 | 内容 |
|------|------|
| 目的地 | ${trip.destination} |
| 开始日期 | ${formatDate(trip.startDate)} |
| 结束日期 | ${formatDate(trip.endDate)} |
| 状态 | ${trip.isEnded === 1 ? "已结束" : "进行中"} |
| 账单数 | ${expenses.length} 条 |
| 游记数 | ${notes.length} 篇 |
`;

	// 统计
	const dates = new Set(expenses.map((e) => formatDate(e.expenseDate)));
	const avgPerDay = dates.size > 0 ? total / dates.size : 0;

	const categoryMap = {};
	for (const e of expenses) {
		if (!categoryMap[e.category]) {
			categoryMap[e.category] = { total: 0, count: 0 };
		}
		categoryMap[e.category].total += parseFloat(e.amount || 0);
		categoryMap[e.category].count += 1;
	}

	let maxCategory = "暂无";
	let maxAmount = 0;
	for (const [cat, data] of Object.entries(categoryMap)) {
		if (data.total > maxAmount) {
			maxAmount = data.total;
			maxCategory = cat;
		}
	}

	let totalImages = 0;
	for (const n of notes) {
		totalImages += n.images?.length || 0;
	}

	const stats = `## 消费统计

| 指标 | 数值 |
|------|------|
| 总支出 | ¥${total.toFixed(2)} |
| 日均支出 | ¥${avgPerDay.toFixed(2)} |
| 消费笔数 | ${expenses.length} 笔 |
| 最高消费类别 | ${maxCategory} |
| 游记篇数 | ${notes.length} 篇 |
| 游记图片数 | ${totalImages} 张 |
`;

	// 分类明细
	let categoryDetail = "";
	if (Object.keys(categoryMap).length > 0) {
		const rows = Object.entries(categoryMap)
			.sort((a, b) => b[1].total - a[1].total)
			.map(([cat, data]) => `| ${cat} | ${data.count} 笔 | ¥${data.total.toFixed(2)} | ${total > 0 ? ((data.total / total) * 100).toFixed(1) : 0}% |`)
			.join("\n");

		categoryDetail = `### 分类明细

| 分类 | 笔数 | 金额 | 占比 |
|------|------|------|------|
${rows}
`;
	}

	// 账单
	let expensesSection = "## 账单明细\n\n";
	if (expenses.length > 0) {
		const expenseRows = expenses
			.map((e) => `| ${formatDate(e.expenseDate)} | ${e.category} | ¥${parseFloat(e.amount || 0).toFixed(2)} | ${e.note || "-"} |`)
			.join("\n");

		expensesSection += `| 日期 | 分类 | 金额 | 备注 |
|------|------|------|------|
${expenseRows}

**合计: ¥${total.toFixed(2)}**
`;
	} else {
		expensesSection += "暂无账单记录\n";
	}

	// 游记
	let notesSection = "## 游记\n\n";
	if (notes.length > 0) {
		const notesMD = notes
			.map((note) => {
				let md = `### ${formatDate(note.noteDate)}\n\n${note.content}\n\n`;
				if (note.images && note.images.length > 0) {
					note.images.forEach((img) => {
						const base64 = imageToBase64(img);
						md += `![图片](${base64})\n\n`;
					});
				}
				return md;
			})
			.join("---\n\n");

		notesSection += notesMD;
	} else {
		notesSection += "暂无游记内容\n";
	}

	return `# ${trip.title}

> 目的地: ${trip.destination}  
> 日期: ${formatDate(trip.startDate)} ~ ${formatDate(trip.endDate)}

---

${overview}

---

${stats}

${categoryDetail}

---

${expensesSection}

---

${notesSection}

---

*由 NomadNotes 游迹 导出 &mdash; ${new Date().toISOString().slice(0, 10)}*
`;
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
 * HTML 实体转义
 * @param {string} str - 原始字符串
 * @returns {string} 转义后字符串
 */
function escapeHtml(str) {
	if (!str) return "";
	return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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
	const title = (trip.title || "旅程报告").replace(/[\\/:*?"<>|]/g, "_");
	const date = new Date().toISOString().slice(0, 10);
	return `${title}_${date}.${ext}`;
}

/**
 * 导出旅程完整报告
 * 包含概览、账单、统计、游记四大模块
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
	const noteWhere = { tripId };
	if (noteIds && noteIds.length > 0) {
		noteWhere.id = noteIds;
	}

	const notes = await Note.findAll({
		where: noteWhere,
		order: [["noteDate", "ASC"]],
	});

	// 查询账单
	const expenses = await Expense.findAll({
		where: { tripId },
		order: [["expenseDate", "ASC"]],
	});

	let content;
	switch (format) {
		case "html":
		case "pdf":
			content = buildHTML(trip, notes, expenses);
			break;
		case "markdown":
			content = buildMarkdown(trip, notes, expenses);
			break;
		default:
			throw new AppError(`不支持的导出格式: ${format}`, 400);
	}

	const filename = generateFilename(trip, format);

	return { content, filename, format };
}
