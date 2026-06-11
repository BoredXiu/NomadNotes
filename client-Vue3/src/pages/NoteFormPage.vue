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
						:file-list="tempFiles.map((f, idx) => ({ uid: idx, name: f.fileId, url: f.imageUrl, status: 'success' as const }))"
						:before-upload="handleFileUpload"
						:on-remove="handleFileRemove"
						list-type="picture-card"
						accept="image/jpeg,image/png,image/webp"
						:auto-upload="false"
						multiple
						:disabled="uploading"
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
	import { createNoteWithTempFiles, getNoteById, updateNote, uploadTmpImages } from "../api/notes";
	import { compressImage } from "../utils/compress";
	import dayjs from "dayjs";

	const route = useRoute();
	const router = useRouter();
	const formRef = ref<FormInstance>();
	const submitting = ref(false);
	const loading = ref(false);
	const uploading = ref(false);
	const replacingImages = ref(false);

	const tripId = route.params.tripId as string;
	const noteId = route.params.noteId as string | undefined;
	const isEditing = !!noteId;

	// 已上传到 tmp 的临时文件信息
	interface TempFileInfo {
		fileId: string;
		imageUrl: string;
		ext: string;
	}

	const tempFiles = ref<TempFileInfo[]>([]);
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

	// 选择图片后立即压缩并上传到 tmp 目录
	async function handleFileUpload(file: File) {
		if (file.size > 10 * 1024 * 1024) {
			ElMessage.warning("图片大小不能超过 10MB");
			return false;
		}
		uploading.value = true;
		try {
			// 客户端压缩图片（最长边 750px，JPEG 0.8 质量）
			const compressed = await compressImage(file, 750, 0.8);
			const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
			// 上传到服务器 tmp 目录
			const results = await uploadTmpImages([compressedFile]);
			const result = results[0];
			tempFiles.value.push({
				fileId: result.fileId,
				imageUrl: result.imageUrl,
				ext: result.ext,
			});
			ElMessage.success(`图片 "${file.name}" 已压缩并暂存`);
		} catch {
			ElMessage.error(`图片 "${file.name}" 上传失败`);
		} finally {
			uploading.value = false;
		}
		return false;
	}

	function handleFileRemove(uploadFile: UploadFile) {
		// 通过 file.name 匹配 fileId 来移除对应的临时文件
		const fileId = uploadFile.name;
		tempFiles.value = tempFiles.value.filter((f) => f.fileId !== fileId);
	}

	async function handleSubmit() {
		if (!formRef.value) return;
		const valid = await formRef.value.validate().catch(() => false);
		if (!valid) return;

		if (!isEditing && tempFiles.value.length === 0) {
			ElMessage.warning("请先上传图片");
			return;
		}

		submitting.value = true;
		try {
			if (isEditing && noteId) {
				if (replacingImages.value && tempFiles.value.length > 0) {
					// 编辑模式下替换图片：图片已在 tmp 中，保存时后端会移动到 images
					await updateNote(noteId, {
						content: formData.content,
						noteDate: formData.noteDate,
						tempFiles: tempFiles.value.map((t: TempFileInfo) => ({
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
				// 新建游记：图片已在 tmp 中，保存时后端会移动到 images
				await createNoteWithTempFiles(tripId, {
					content: formData.content,
					noteDate: formData.noteDate,
					tempFiles: tempFiles.value.map((t: TempFileInfo) => ({
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
