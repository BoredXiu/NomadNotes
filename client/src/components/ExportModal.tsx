import React, { useState } from "react";
import { Modal, Select, Checkbox, Space, Button, message, List, Tag } from "antd";
import { FilePdfOutlined, FileTextOutlined, CodeOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ExportFormat, ExportParams } from "../api/export";
import { exportNotes, exportTripData, downloadBlob } from "../api/export";
import type { Note } from "../types";

interface ExportModalProps {
	open: boolean;
	onClose: () => void;
	tripId: string;
	tripTitle: string;
	notes: Note[];
	hasExpenses: boolean;
}

// 导出格式选项
const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: React.ReactNode; ext: string }[] = [
	{ value: "html", label: "HTML 网页", icon: <CodeOutlined />, ext: ".html" },
	{ value: "markdown", label: "Markdown 文档", icon: <FileTextOutlined />, ext: ".md" },
	{ value: "pdf", label: "PDF 文档", icon: <FilePdfOutlined />, ext: ".pdf" },
	{ value: "json", label: "JSON 文件", icon: <CodeOutlined />, ext: ".json" },
];

/**
 * 游记导出弹窗组件
 * 提供导出格式、范围和文件命名配置
 * 导出内容包含：概览、账单、统计、游记
 */
const ExportModal: React.FC<ExportModalProps> = ({ open, onClose, tripId, tripTitle, notes, hasExpenses }) => {
	const [format, setFormat] = useState<ExportFormat>("html");
	const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
	const [isExportAll, setIsExportAll] = useState(true);
	const [exporting, setExporting] = useState(false);

	// 切换导出全部/指定章节
	const handleToggleExportAll = () => {
		setIsExportAll(!isExportAll);
		if (!isExportAll) {
			setSelectedNoteIds([]);
		}
	};

	// 选择/取消指定游记
	const handleNoteSelect = (noteId: string, checked: boolean) => {
		if (checked) {
			setSelectedNoteIds([...selectedNoteIds, noteId]);
		} else {
			setSelectedNoteIds(selectedNoteIds.filter((id) => id !== noteId));
		}
	};

	/**
	 * 在新窗口中打开 HTML 内容并触发打印为 PDF
	 *
	 * 方案：浏览器原生 window.print()，无需 html2canvas/jsPDF
	 *   1. 创建隐藏 iframe 避免弹窗被拦截
	 *   2. 写入完整 HTML（含 @media print 打印样式）
	 *   3. 等待资源加载后调用 window.print()
	 *   4. 用户选择"另存为 PDF"即可下载
	 */
	const openPrintWindow = async (htmlContent: string) => {
		// 创建隐藏 iframe 避免浏览器拦截弹窗
		const iframe = document.createElement("iframe");
		iframe.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden;";
		document.body.appendChild(iframe);

		const iframeWindow = iframe.contentWindow;
		if (!iframeWindow) {
			document.body.removeChild(iframe);
			throw new Error("无法创建打印窗口");
		}

		// 写入完整 HTML 到 iframe
		iframeWindow.document.open();
		iframeWindow.document.write(htmlContent);
		iframeWindow.document.close();

		// 等待 iframe 内资源加载完成
		await new Promise<void>((resolve) => {
			iframeWindow.onload = () => resolve();
			// 超时兜底
			setTimeout(resolve, 3000);
		});

		// 触发打印对话框
		iframeWindow.focus();
		iframeWindow.print();

		// 延迟清理 iframe（打印对话框关闭后）
		setTimeout(() => {
			if (document.body.contains(iframe)) {
				document.body.removeChild(iframe);
			}
		}, 1000);
	};

	// 执行导出
	const handleExport = async () => {
		if (!isExportAll && selectedNoteIds.length === 0) {
			message.warning("请至少选择一章游记");
			return;
		}

		setExporting(true);
		try {
			// JSON 格式使用独立的旅程数据导出接口
			// exportTripData 返回的 responseType 为 blob，res.data 已是 Blob 对象
			if (format === "json") {
				const res = await exportTripData(tripId);
				const blob = res.data;
				const date = new Date().toISOString().slice(0, 10);
				const safeTitle = tripTitle.replace(/[\\/:*?"<>|]/g, "_");
				downloadBlob(blob, `${safeTitle}_${date}.json`);
				message.success("导出成功");
				onClose();
				return;
			}

			const params: ExportParams = {
				tripId,
				// PDF 导出时先请求 HTML 内容，前端再转换
				format: format === "pdf" ? "html" : format,
				noteIds: isExportAll ? null : selectedNoteIds,
			};

			const blob = await exportNotes(params);

			// 生成文件名
			const date = new Date().toISOString().slice(0, 10);
			const safeTitle = tripTitle.replace(/[\\/:*?"<>|]/g, "_");

			if (format === "pdf") {
				// PDF: 读取 HTML 内容并在新窗口中打印
				const htmlContent = await blob.text();
				await openPrintWindow(htmlContent);
			} else {
				const ext = FORMAT_OPTIONS.find((f) => f.value === format)?.ext || ".html";
				const filename = `${safeTitle}_${date}${ext}`;
				downloadBlob(blob, filename);
			}

			message.success("导出成功");
			onClose();
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			message.error(err?.response?.data?.message || "导出失败，请重试");
		} finally {
			setExporting(false);
		}
	};

	const hasContent = notes.length > 0 || hasExpenses;

	return (
		<Modal
			title="导出旅程报告"
			open={open}
			onCancel={onClose}
			footer={null}
			width={520}
			destroyOnClose
		>
			<Space direction="vertical" size="middle" style={{ width: "100%" }}>
				{/* 导出内容说明 */}
				<div
					style={{
						background: "#f6ffed",
						border: "1px solid #b7eb8f",
						borderRadius: 6,
						padding: "8px 12px",
						fontSize: 13,
						color: "#52c41a",
					}}
				>
					导出内容包含：旅程概览、消费统计、账单明细、游记
				</div>

				{/* 导出格式选择 */}
				<div>
					<div style={{ marginBottom: 8, fontWeight: 500 }}>导出格式</div>
					<Select
						value={format}
						onChange={(val) => setFormat(val)}
						style={{ width: "100%" }}
						options={FORMAT_OPTIONS.map((opt) => ({
							value: opt.value,
							label: (
								<Space>
									{opt.icon}
									{opt.label}
								</Space>
							),
						}))}
					/>
				</div>

				{/* 导出范围选择 */}
				<div>
					<div style={{ marginBottom: 8, fontWeight: 500 }}>导出范围</div>
					<Checkbox checked={isExportAll} onChange={handleToggleExportAll}>
						导出全部游记（共 {notes.length} 篇）
					</Checkbox>
				</div>

				{/* 指定章节选择 */}
				{!isExportAll && (
					<div
						style={{
							border: "1px solid #f0f0f0",
							borderRadius: 8,
							padding: 12,
							maxHeight: 240,
							overflow: "auto",
						}}
					>
						{notes.length === 0 ? (
							<div style={{ color: "#999", textAlign: "center", padding: 16 }}>
								暂无游记
							</div>
						) : (
							<List
								dataSource={notes}
								renderItem={(note) => {
									const checked = selectedNoteIds.includes(note.id);
									const dateStr = note.noteDate
										? new Date(note.noteDate).toLocaleDateString("zh-CN")
										: "";
									return (
										<div
											style={{
												display: "flex",
												alignItems: "center",
												padding: "4px 0",
											}}
										>
											<Checkbox
												checked={checked}
												onChange={(e) => handleNoteSelect(note.id, e.target.checked)}
											>
												<Space>
													<Tag
														color="blue"
														style={{ marginRight: 0, fontSize: 11 }}
													>
														{dateStr}
													</Tag>
													<span style={{ fontSize: 13, color: "#666" }}>
														{note.content
															? note.content.slice(0, 40) +
															  (note.content.length > 40 ? "..." : "")
															: "无内容"}
													</span>
												</Space>
											</Checkbox>
										</div>
									);
								}}
							/>
						)}
					</div>
				)}

				{!hasContent && (
					<div style={{ color: '#faad14', fontSize: 13 }}>
						该旅程暂无账单和游记数据，导出内容将仅包含概览信息
					</div>
				)}

				{/* 导出按钮 */}
				<div style={{ textAlign: "right", marginTop: 8 }}>
					<Space>
						<Button onClick={onClose}>取消</Button>
						<Button
							type="primary"
							icon={<DownloadOutlined />}
							loading={exporting}
							onClick={handleExport}
						>
							导出
						</Button>
					</Space>
				</div>
			</Space>
		</Modal>
	);
};

export default ExportModal;