<template>
	<div class="note-form-page">
		<el-card
			class="note-form-card"
			v-loading="loading"
		>
			<el-space class="note-form-header">
				<el-button
					text
					:icon="ArrowLeft"
					@click="router.back()"
				/>
				<h4 style="margin: 0">{{ isEditing ? "编辑游记" : "写游记" }}</h4>
			</el-space>

			<el-form
				ref="formRef"
				:model="formData"
				:rules="rules"
				label-position="top"
				@submit.prevent="handleSubmit"
			>
				<el-form-item
					prop="noteDate"
					label="记录日期"
				>
					<el-date-picker
						v-model="formData.noteDate"
						type="datetime"
						placeholder="选择日期"
						style="width: 100%"
						format="YYYY-MM-DD HH:mm:ss"
						value-format="YYYY-MM-DD HH:mm:ss"
					/>
				</el-form-item>

				<el-form-item
					prop="content"
					label="游记正文"
				>
					<el-input
						v-model="formData.content"
						type="textarea"
						:rows="6"
						placeholder="记录旅途中的精彩瞬间..."
					/>
				</el-form-item>

				<!-- 已有图片（编辑模式） -->
				<el-form-item
					v-if="isEditing && existingImages.length > 0 && !replacingImages"
					label="已有图片"
				>
					<el-row :gutter="8">
						<el-col
							v-for="(img, idx) in existingImages"
							:key="idx"
						>
							<el-image
								:src="img"
								:alt="'游记图片 ' + (idx + 1)"
								style="max-height: 150px; object-fit: contain"
							/>
						</el-col>
					</el-row>
					<el-button
						type="primary"
						plain
						:icon="Upload"
						@click="startReplace"
						style="margin-top: 8px"
					>
						替换图片
					</el-button>
				</el-form-item>

				<!-- 图片上传 -->
				<el-form-item
					v-else
					label="图片"
				>
					<el-upload
						:file-list="fileList"
						:before-upload="handleFileUpload"
						:on-remove="handleFileRemove"
						list-type="picture-card"
						accept="image/jpeg,image/png,image/webp"
						:auto-upload="false"
						multiple
					>
						<el-icon :size="24"><Plus /></el-icon>
					</el-upload>
				</el-form-item>

				<el-form-item>
					<el-button
						type="primary"
						:loading="submitting"
						native-type="submit"
						style="width: 100%"
					>
						{{ isEditing ? "更新游记" : "发布游记" }}
					</el-button>
				</el-form-item>
			</el-form>
		</el-card>
	</div>
</template>

<script setup lang="ts">
	import { ref, reactive, onMounted } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { ArrowLeft, Plus, Upload } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import type { FormInstance, FormRules, UploadFile } from "element-plus";
	import { createNoteWithTempFiles, getNoteById, updateNote, uploadTmpImages, type TempFileResult } from "../api/notes";
	import { compressImage } from "../utils/compress";
	import type { Note } from "../types";
	import dayjs from "dayjs";

	const route = useRoute();
	const router = useRouter();
	const formRef = ref<FormInstance>();
	const submitting = ref(false);
	const loading = ref(false);
	const replacingImages = ref(false);

	const tripId = route.params.tripId as string;
	const noteId = route.params.noteId as string | undefined;
	const isEditing = !!noteId;

	const fileList = ref<UploadFile[]>([]);
	const pendingFiles = ref<File[]>([]);
	const existingImages = ref<string[]>([]);

	const formData = reactive({
		content: "",
		noteDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
	});

	const rules: FormRules = {
		content: [{ required: true, message: "请输入游记内容", trigger: "blur" }],
		noteDate: [{ required: true, message: "请选择日期", trigger: "change" }],
	};

	function startReplace() {
		replacingImages.value = true;
	}

	function handleFileUpload(file: File) {
		if (file.size > 10 * 1024 * 1024) {
			ElMessage.warning("图片大小不能超过 10MB");
			return false;
		}
		pendingFiles.value.push(file);
		return false;
	}

	function handleFileRemove(file: UploadFile) {
		const index = pendingFiles.value.indexOf(file.raw as File);
		if (index > -1) {
			pendingFiles.value.splice(index, 1);
		}
	}

	async function handleSubmit() {
		if (!formRef.value) return;
		const valid = await formRef.value.validate().catch(() => false);
		if (!valid) return;

		if (!isEditing && pendingFiles.value.length === 0) {
			ElMessage.warning("请先上传图片");
			return;
		}

		submitting.value = true;
		try {
			if (isEditing && noteId) {
				if (replacingImages.value && pendingFiles.value.length > 0) {
					const tempResults = await uploadTmpImages(pendingFiles.value);
					await updateNote(noteId, {
						content: formData.content,
						noteDate: formData.noteDate,
						tempFiles: tempResults.map((t: TempFileResult) => ({
							fileId: t.fileId,
							ext: t.ext,
						})),
					});
				} else {
					await updateNote(noteId, {
						content: formData.content,
						noteDate: formData.noteDate,
					});
				}
				ElMessage.success("游记更新成功");
				router.push(`/trip/${tripId}?tab=notes`);
			} else {
				const tempResults = await uploadTmpImages(pendingFiles.value);
				await createNoteWithTempFiles(tripId, {
					content: formData.content,
					noteDate: formData.noteDate,
					tempFiles: tempResults.map((t: TempFileResult) => ({
						fileId: t.fileId,
						ext: t.ext,
					})),
				});
				ElMessage.success("游记发布成功");
				router.push(`/trip/${tripId}?tab=notes`);
			}
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			ElMessage.error(err?.response?.data?.message || "操作失败");
		} finally {
			submitting.value = false;
		}
	}

	onMounted(async () => {
		if (isEditing && noteId) {
			loading.value = true;
			try {
				const note = await getNoteById(noteId);
				formData.content = note.content;
				formData.noteDate = note.noteDate;
				if (note.images) {
					existingImages.value = note.images;
					fileList.value = note.images.map((url, idx) => ({
						uid: idx,
						name: `image-${idx}`,
						url,
						status: "success" as const,
					}));
				}
			} catch {
				ElMessage.error("加载游记失败");
				router.back();
			} finally {
				loading.value = false;
			}
		}
	});
</script>

<style scoped lang="scss">
	.note-form-page {
		max-width: 700px;
		margin: 0 auto;
	}

	.note-form-header {
		margin-bottom: 24px;
	}

	/* 暗黑主题支持 */
	.dark-theme .note-form-page h4 {
		color: #e8e8e8 !important;
	}

	.dark-theme .note-form-page .el-button--text {
		color: #bfbfbf !important;
	}

	.dark-theme .note-form-page .el-button--text:hover {
		color: #e8e8e8 !important;
	}

	.dark-theme .note-form-page :deep(.el-textarea__inner) {
		background-color: #2a2a2a !important;
		color: #e8e8e8 !important;
	}
</style>
