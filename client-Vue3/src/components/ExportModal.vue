<template>
	<el-dialog
		:model-value="open"
		title="导出旅程报告"
		width="520px"
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
			<div>
				<div style="margin-bottom: 8px; font-weight: 500">导出格式</div>
				<el-select
					v-model="format"
					style="width: 100%"
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
			<div>
				<div style="margin-bottom: 8px; font-weight: 500">导出范围</div>
				<el-checkbox
					v-model="isExportAll"
					@change="handleToggleExportAll"
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
	import { ref, computed } from "vue";
	import { Download } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import type { ExportFormat, ExportParams } from "../api/export";
	import { exportNotes, downloadBlob } from "../api/export";
	import type { Note } from "../types";
	import html2pdf from "html2pdf.js";

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
		{ value: "html" as ExportFormat, label: "HTML 网页", icon: "Document", ext: ".html" },
		{ value: "markdown" as ExportFormat, label: "Markdown 文档", icon: "Tickets", ext: ".md" },
		{ value: "pdf" as ExportFormat, label: "PDF 文档", icon: "Document", ext: ".pdf" },
	];

	const format = ref<ExportFormat>("html");
	const selectedNoteIds = ref<string[]>([]);
	const isExportAll = ref(true);
	const exporting = ref(false);

	const hasContent = computed(() => props.notes.length > 0 || props.hasExpenses);

	function formatDate(dateStr: string) {
		return dateStr ? new Date(dateStr).toLocaleDateString("zh-CN") : "";
	}

	function handleToggleExportAll() {
		isExportAll.value = !isExportAll.value;
		if (!isExportAll.value) {
			selectedNoteIds.value = [];
		}
	}

	function handleNoteSelect(noteId: string, checked: boolean) {
		if (checked) {
			selectedNoteIds.value.push(noteId);
		} else {
			selectedNoteIds.value = selectedNoteIds.value.filter((id) => id !== noteId);
		}
	}

	async function convertToPDF(htmlContent: string, filename: string) {
		const container = document.createElement("div");
		container.style.position = "absolute";
		container.style.left = "-9999px";
		container.style.top = "0";
		container.innerHTML = htmlContent;
		document.body.appendChild(container);

		try {
			const opt = {
				margin: [10, 10, 10, 10] as [number, number, number, number],
				filename,
				image: { type: "jpeg" as const, quality: 0.95 },
				html2canvas: { scale: 2, useCORS: true, letterRendering: true },
				jsPDF: {
					unit: "mm",
					format: "a4",
					orientation: "portrait" as const,
				},
			};
			await html2pdf().set(opt).from(container).save();
		} finally {
			document.body.removeChild(container);
		}
	}

	async function handleExport() {
		if (!isExportAll.value && selectedNoteIds.value.length === 0) {
			ElMessage.warning("请至少选择一章游记");
			return;
		}

		exporting.value = true;
		try {
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
				const filename = `${safeTitle}_${date}.pdf`;
				await convertToPDF(htmlContent, filename);
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
