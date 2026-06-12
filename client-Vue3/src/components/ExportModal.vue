<template>
	<el-dialog
		:model-value="open"
		title="导出旅程报告"
		width="520px"
		append-to-body
		@update:model-value="emit('close')"
		destroy-on-close
	>
		<el-space
			direction="vertical"
			:size="16"
			style="width: 100%"
		>
			<!-- 导出内容说明 -->
			<div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #52c41a">
				导出内容包含：旅程概览、消费统计、账单明细、游记
			</div>

			<!-- 导出格式选择 -->
			<div style="display: flex; align-items: center; gap: 12px">
				<span style="font-weight: 500; white-space: nowrap; min-width: 70px">导出格式</span>
				<el-select
					v-model="format"
					size="large"
					style="flex: 1; min-width: 0; width: 10rem"
					:teleported="false"
				>
					<el-option
						v-for="opt in formatOptions"
						:key="opt.value"
						:value="opt.value"
						:label="opt.label"
					>
						<el-space>
							<el-icon><component :is="opt.icon" /></el-icon>
							<span>{{ opt.label }}</span>
						</el-space>
					</el-option>
				</el-select>
			</div>

			<!-- 导出范围 -->
			<div style="display: flex; align-items: center; gap: 12px">
				<span style="font-weight: 500; white-space: nowrap; min-width: 70px">导出范围</span>
				<el-checkbox
					v-model="isExportAll"
					size="large"
				>
					导出全部游记（共 {{ notes.length }} 篇）
				</el-checkbox>
			</div>

			<!-- 指定章节 -->
			<div
				v-if="!isExportAll"
				style="border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px; max-height: 240px; overflow: auto"
			>
				<div
					v-if="notes.length === 0"
					style="color: #999; text-align: center; padding: 16px"
				>
					暂无游记
				</div>
				<div
					v-for="note in notes"
					:key="note.id"
					style="display: flex; align-items: center; padding: 4px 0"
				>
					<el-checkbox
						:model-value="selectedNoteIds.includes(note.id)"
						@change="(checked: boolean | string | number) => handleNoteSelect(note.id, !!checked)"
					>
						<el-space>
							<el-tag
								size="small"
								type="primary"
								style="font-size: 11px"
							>
								{{ formatDate(note.noteDate) }}
							</el-tag>
							<span style="font-size: 13px; color: #666">
								{{ note.content ? note.content.slice(0, 40) + (note.content.length > 40 ? "..." : "") : "无内容" }}
							</span>
						</el-space>
					</el-checkbox>
				</div>
			</div>

			<div
				v-if="!hasContent"
				style="color: #faad14; font-size: 13px"
			>
				该旅程暂无账单和游记数据，导出内容将仅包含概览信息
			</div>

			<!-- 操作按钮 -->
			<div style="text-align: right; margin-top: 8px">
				<el-space>
					<el-button @click="emit('close')">取消</el-button>
					<el-button
						type="primary"
						:loading="exporting"
						:icon="Download"
						@click="handleExport"
					>
						导出
					</el-button>
				</el-space>
			</div>
		</el-space>
	</el-dialog>
</template>

<script setup lang="ts">
	import { ref, computed, watch } from "vue";
	import { Download, Document } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import type { ExportFormat, ExportParams } from "../api/export";
	import { exportNotes, exportTripData, downloadBlob } from "../api/export";
	import type { Note } from "../types";

	const props = defineProps<{
		open: boolean;
		tripId: string;
		tripTitle: string;
		notes: Note[];
		hasExpenses: boolean;
	}>();

	const emit = defineEmits<{
		(e: "close"): void;
	}>();

	const formatOptions = [
		{ value: "html" as ExportFormat, label: "HTML 网页", icon: Document, ext: ".html" },
		{ value: "markdown" as ExportFormat, label: "Markdown 文档", icon: Document, ext: ".md" },
		{ value: "pdf" as ExportFormat, label: "PDF 文档", icon: Document, ext: ".pdf" },
		{ value: "json" as ExportFormat, label: "JSON 文件", icon: Document, ext: ".json" },
	];

	const format = ref<ExportFormat>("html");
	const selectedNoteIds = ref<string[]>([]);
	const isExportAll = ref(true);
	const exporting = ref(false);

	const hasContent = computed(() => props.notes.length > 0 || props.hasExpenses);

	function formatDate(dateStr: string) {
		return dateStr ? new Date(dateStr).toLocaleDateString("zh-CN") : "";
	}

	// 监听导出范围切换，取消"导出全部"时清空已选
	watch(isExportAll, (val) => {
		if (!val) {
			selectedNoteIds.value = [];
		}
	});

	// 监听弹窗打开，重置状态
	watch(
		() => props.open,
		(val) => {
			if (val) {
				isExportAll.value = true;
				selectedNoteIds.value = [];
				format.value = "html";
			}
		},
	);

	function handleNoteSelect(noteId: string, checked: boolean) {
		if (checked) {
			selectedNoteIds.value.push(noteId);
		} else {
			selectedNoteIds.value = selectedNoteIds.value.filter((id) => id !== noteId);
		}
	}

	/**
	 * 在新窗口中打开 HTML 内容并触发打印为 PDF
	 *
	 * 方案：浏览器原生 window.print()，无需 html2canvas/jsPDF
	 *   1. 创建隐藏 iframe 避免弹窗被拦截
	 *   2. 写入完整 HTML（含 @media print 打印样式）
	 *   3. 等待资源加载后调用 window.print()
	 *   4. 用户选择"另存为 PDF"即可下载
	 */
	async function openPrintWindow(htmlContent: string) {
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
	}

	async function handleExport() {
		if (!isExportAll.value && selectedNoteIds.value.length === 0) {
			ElMessage.warning("请至少选择一章游记");
			return;
		}

		exporting.value = true;
		try {
			// JSON 格式使用独立的旅程数据导出接口
			// exportTripData 返回的 responseType 为 blob，res.data 已是 Blob 对象
			if (format.value === "json") {
				const res = await exportTripData(props.tripId);
				const blob = res.data;
				const date = new Date().toISOString().slice(0, 10);
				const safeTitle = props.tripTitle.replace(/[\\/:*?"<>|]/g, "_");
				downloadBlob(blob, `${safeTitle}_${date}.json`);
				ElMessage.success("导出成功");
				emit("close");
				return;
			}

			const params: ExportParams = {
				tripId: props.tripId,
				format: format.value === "pdf" ? "html" : format.value,
				noteIds: isExportAll.value ? null : selectedNoteIds.value,
			};

			const blob = await exportNotes(params);
			const date = new Date().toISOString().slice(0, 10);
			const safeTitle = props.tripTitle.replace(/[\\/:*?"<>|]/g, "_");

			if (format.value === "pdf") {
				const htmlContent = await blob.text();
				await openPrintWindow(htmlContent);
			} else {
				const ext = formatOptions.find((f) => f.value === format.value)?.ext || ".html";
				const filename = `${safeTitle}_${date}${ext}`;
				downloadBlob(blob, filename);
			}

			ElMessage.success("导出成功");
			emit("close");
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			ElMessage.error(err?.response?.data?.message || "导出失败，请重试");
		} finally {
			exporting.value = false;
		}
	}
</script>

<style scoped lang="scss">
	/* 暗黑主题支持 */
	.dark-theme :deep(.el-dialog) {
		background-color: #1f1f1f !important;
	}

	.dark-theme :deep(.el-dialog__title) {
		color: #e8e8e8 !important;
	}

	.dark-theme :deep(.el-dialog__body) {
		color: #e8e8e8 !important;
	}

	.dark-theme .export-info-box {
		background: #1a2e1a !important;
		border-color: #2a4a2a !important;
		color: #73d13d !important;
	}

	.dark-theme .export-note-list {
		border-color: #303030 !important;
	}

	.dark-theme .export-note-item span {
		color: #bfbfbf !important;
	}

	.dark-theme .export-warning {
		color: #d48806 !important;
	}

	.dark-theme .export-no-notes {
		color: #8c8c8c !important;
	}
</style>
