<template>
	<div class="trip-form-page">
		<el-card class="trip-form-card">
			<el-space style="margin-bottom: 24px">
				<el-button
					text
					:icon="ArrowLeft"
					@click="router.back()"
				/>
				<h4 style="margin: 0">{{ isEditing ? "编辑旅程" : "新建旅程" }}</h4>
			</el-space>

			<el-form
				ref="formRef"
				:model="formData"
				:rules="rules"
				label-position="top"
				@submit.prevent="handleSubmit"
			>
				<el-form-item
					prop="title"
					label="旅程名称"
				>
					<el-input
						v-model="formData.title"
						placeholder="例如：京都红叶之旅"
					/>
				</el-form-item>

				<el-form-item
					prop="destination"
					label="目的地"
				>
					<el-input
						v-model="formData.destination"
						placeholder="例如：日本京都"
					>
						<template #suffix>
							<el-button
								text
								size="small"
								:icon="Aim"
								:loading="locating"
								title="获取当前位置"
								@click="handleLocate"
							/>
						</template>
					</el-input>
				</el-form-item>

				<el-form-item
					prop="startDate"
					label="开始日期"
				>
					<el-date-picker
						v-model="formData.startDate"
						type="datetime"
						placeholder="选择开始日期"
						style="width: 100%"
						format="YYYY-MM-DD HH:mm:ss"
						value-format="YYYY-MM-DD HH:mm:ss"
					/>
				</el-form-item>

				<el-form-item
					prop="endDate"
					label="结束日期"
				>
					<el-date-picker
						v-model="formData.endDate"
						type="datetime"
						placeholder="选择结束日期"
						style="width: 100%"
						format="YYYY-MM-DD HH:mm:ss"
						value-format="YYYY-MM-DD HH:mm:ss"
					/>
				</el-form-item>

				<el-form-item label="公开旅程">
					<el-switch v-model="formData.isPublicBoolean" />
				</el-form-item>

				<!-- 封面图片 -->
				<el-form-item
					v-if="coverPreview"
					label="封面图片"
				>
					<el-space
						direction="vertical"
						style="width: 100%"
					>
						<el-image
							:src="coverPreview"
							alt="封面"
							style="max-height: 200px; object-fit: contain"
						/>
						<el-upload
							:show-file-list="false"
							:before-upload="handleCoverUpload"
							accept="image/jpeg,image/png,image/webp"
						>
							<el-button :loading="uploading">更换封面</el-button>
						</el-upload>
					</el-space>
				</el-form-item>
				<el-form-item
					v-else
					label="封面图片"
				>
					<el-upload
						:show-file-list="false"
						:before-upload="handleCoverUpload"
						accept="image/jpeg,image/png,image/webp"
					>
						<div class="trip-form-cover-placeholder">
							<el-icon :size="20"><Plus /></el-icon>
							<div class="trip-form-cover-text">上传封面</div>
						</div>
					</el-upload>
				</el-form-item>

				<el-form-item>
					<el-button
						type="primary"
						:loading="submitting"
						native-type="submit"
						style="width: 100%"
					>
						{{ isEditing ? "更新旅程" : "创建旅程" }}
					</el-button>
				</el-form-item>
			</el-form>
		</el-card>
	</div>
</template>

<script setup lang="ts">
	import { ref, reactive, onMounted } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { ArrowLeft, Location, Plus, Upload, Aim } from "@element-plus/icons-vue";
	import { ElMessage } from "element-plus";
	import type { FormInstance, FormRules } from "element-plus";
	import { createTrip, getTripById, updateTrip } from "../api/trips";
	import { uploadImage } from "../api/upload";
	import { compressImage } from "../utils/compress";
	import { uploadFileToTemp, persistSingle } from "../api/expenses";
	import api from "../api/client";

	const route = useRoute();
	const router = useRouter();
	const formRef = ref<FormInstance>();
	const submitting = ref(false);
	const uploading = ref(false);
	const locating = ref(false);
	const coverPreview = ref<string | null>(null);
	const uploadedCoverUrl = ref<string | null>(null);
	const tempFile = ref<{ fileId: string; ext: string } | null>(null);

	const tripId = route.params.id as string | undefined;
	const isEditing = !!tripId;

	const formData = reactive({
		title: "",
		destination: "",
		startDate: "",
		endDate: "",
		isPublic: 0,
		isPublicBoolean: false,
	});

	const rules: FormRules = {
		title: [{ required: true, message: "请输入旅程名称", trigger: "blur" }],
		destination: [{ required: true, message: "请输入目的地", trigger: "blur" }],
		startDate: [{ required: true, message: "请选择开始日期", trigger: "change" }],
		endDate: [{ required: true, message: "请选择结束日期", trigger: "change" }],
	};

	async function handleCoverUpload(file: File): Promise<boolean> {
		uploading.value = true;
		try {
			const compressed = await compressImage(file, 750, 0.8);
			const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
			const result = await uploadFileToTemp(compressedFile);
			tempFile.value = { fileId: result.fileId, ext: result.ext };
			coverPreview.value = URL.createObjectURL(compressedFile);
			ElMessage.success("封面上传成功");
		} catch {
			ElMessage.error("上传失败");
		} finally {
			uploading.value = false;
		}
		return false;
	}

	async function handleLocate() {
		locating.value = true;

		// 清除之前的定位错误（如果有）
		// 先尝试浏览器原生定位
		if (navigator.geolocation) {
			try {
				const position = await new Promise<GeolocationPosition>((resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 0,
					});
				});

				const { latitude, longitude } = position.coords;
				await fillAddressFromCoords(latitude, longitude);
				locating.value = false;
				return;
			} catch (err: unknown) {
				const geolocErr = err as GeolocationPositionError;
				// 权限被拒绝时，尝试 IP 定位兜底
				if (geolocErr.code === 1) {
					ElMessage.info("浏览器定位被拒绝，尝试通过IP定位...");
				} else {
					const messages: Record<number, string> = {
						2: "无法获取位置信息",
						3: "定位超时",
					};
					ElMessage.error(messages[geolocErr.code] || "定位失败");
					locating.value = false;
					return;
				}
			}
		}

		// IP 定位兜底（浏览器不支持或权限被拒绝时）
		try {
			const resp = await fetch("https://ipapi.co/json/");
			if (resp.ok) {
				const json = await resp.json();
				const parts: string[] = [];
				if (json.region) parts.push(json.region);
				if (json.city) parts.push(json.city);
				formData.destination = parts.join("") || `${json.latitude?.toFixed(4)}, ${json.longitude?.toFixed(4)}`;
				ElMessage.success(`已定位: ${formData.destination}`);
			}
		} catch {
			ElMessage.error("IP定位失败，请手动输入目的地");
		}
		locating.value = false;
	}

	// 从经纬度获取地址
	async function fillAddressFromCoords(latitude: number, longitude: number) {
		try {
			const { data } = await api.get<{ success: boolean; data: { displayName: string } }>("/geocode/reverse", {
				params: { lat: latitude, lon: longitude },
			});
			if (data.success && data.data.displayName) {
				formData.destination = data.data.displayName;
				ElMessage.success(`已定位: ${data.data.displayName}`);
				return;
			}
			throw new Error("empty");
		} catch {
			try {
				const resp = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`);
				if (resp.ok) {
					const json = await resp.json();
					const parts: string[] = [];
					if (json.principalSubdivision) parts.push(json.principalSubdivision);
					if (json.city) parts.push(json.city);
					if (json.locality && json.locality !== json.city) parts.push(json.locality);
					formData.destination = parts.join("");
					ElMessage.success(`已定位: ${parts.join("")}`);
				}
			} catch {
				formData.destination = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
				ElMessage.info("无法获取中文地址，已填入坐标");
			}
		}
	}

	async function handleSubmit() {
		if (!formRef.value) return;
		const valid = await formRef.value.validate().catch(() => false);
		if (!valid) return;

		submitting.value = true;
		try {
			let coverImage: string | undefined = uploadedCoverUrl.value || undefined;

			if (tempFile.value) {
				const result = await persistSingle(tempFile.value.fileId, tempFile.value.ext);
				coverImage = result.imageUrl;
			}

			const payload = {
				title: formData.title,
				destination: formData.destination,
				startDate: formData.startDate,
				endDate: formData.endDate || "",
				isPublic: formData.isPublicBoolean ? 1 : 0,
				coverImage,
			};

			if (isEditing && tripId) {
				await updateTrip(tripId, payload);
				ElMessage.success("旅程更新成功");
			} else {
				await createTrip(payload);
				ElMessage.success("旅程创建成功");
			}
			router.push("/");
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			ElMessage.error(err?.response?.data?.message || "操作失败");
		} finally {
			submitting.value = false;
		}
	}

	onMounted(async () => {
		if (isEditing && tripId) {
			try {
				const trip = await getTripById(tripId);
				formData.title = trip.title;
				formData.destination = trip.destination;
				formData.startDate = trip.startDate;
				formData.endDate = trip.endDate || "";
				formData.isPublicBoolean = trip.isPublic === 1;
				coverPreview.value = trip.coverImage || null;
				uploadedCoverUrl.value = trip.coverImage || null;
			} catch {
				ElMessage.error("加载旅程信息失败");
				router.push("/");
			}
		}
	});
</script>

<style scoped lang="scss">
	.trip-form-page {
		max-width: 600px;
		margin: 0 auto;
	}

	.trip-form-cover-placeholder {
		width: 102px;
		height: 102px;
		border: 1px dashed #d9d9d9;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: border-color 0.3s;
	}

	.trip-form-cover-placeholder:hover {
		border-color: #667eea;
	}

	.trip-form-cover-text {
		margin-top: 8px;
		color: #999;
		font-size: 12px;
	}

	/* 暗黑主题支持 */
	.dark-theme .trip-form-page h4 {
		color: #e8e8e8 !important;
	}

	.dark-theme .trip-form-page .el-button--text {
		color: #bfbfbf !important;
	}

	.dark-theme .trip-form-cover-placeholder {
		border-color: #3a3a3a !important;
		background-color: #2a2a2a !important;
	}

	.dark-theme .trip-form-cover-placeholder .el-icon {
		color: #8c8c8c !important;
	}

	.dark-theme .trip-form-cover-text {
		color: #8c8c8c !important;
	}
</style>
