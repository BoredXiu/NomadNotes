<template>
	<div class="profile-edit-page">
		<el-button
			type="text"
			:icon="ArrowLeft"
			@click="router.push('/')"
			class="profile-edit-back"
		>
			返回
		</el-button>

		<el-card
			class="profile-edit-card"
			v-loading="loading"
		>
			<template #header>
				<h4 style="margin: 0">编辑个人资料</h4>
			</template>

			<!-- 头像区域 -->
			<div class="profile-edit-avatar-section">
				<el-avatar
					v-if="avatarUrl"
					:src="avatarUrl"
					:size="100"
				/>
				<el-avatar
					v-else
					:size="100"
					:icon="User"
				/>
				<div class="profile-edit-avatar-upload">
					<el-upload
						:show-file-list="false"
						:before-upload="handleUpload"
						accept="image/jpeg,image/png,image/webp"
					>
						<el-button :icon="Upload">更换头像</el-button>
					</el-upload>
				</div>
			</div>

			<el-form
				ref="formRef"
				:model="formData"
				:rules="rules"
				label-position="top"
				@submit.prevent="handleSave"
			>
				<el-form-item
					prop="username"
					label="昵称"
				>
					<el-input
						v-model="formData.username"
						placeholder="请输入昵称"
					/>
				</el-form-item>

				<el-form-item
					prop="bio"
					label="个人介绍"
				>
					<el-input
						v-model="formData.bio"
						type="textarea"
						:rows="3"
						placeholder="介绍一下自己..."
						maxlength="500"
						show-word-limit
					/>
				</el-form-item>

				<el-form-item
					prop="address"
					label="所在地区"
				>
					<el-cascader
						v-model="formData.address"
						:options="areaOptions"
						placeholder="请选择所在地区"
						style="width: 100%"
						clearable
					/>
				</el-form-item>

				<el-form-item
					prop="gender"
					label="性别"
				>
					<el-select
						v-model="formData.gender"
						placeholder="请选择性别"
						clearable
						style="width: 100%"
					>
						<el-option
							value="male"
							label="男"
						/>
						<el-option
							value="female"
							label="女"
						/>
					</el-select>
				</el-form-item>

				<el-form-item>
					<el-button
						type="primary"
						:loading="saving"
						native-type="submit"
						block
						size="large"
					>
						保存
					</el-button>
				</el-form-item>
			</el-form>
		</el-card>
	</div>
</template>

<script setup lang="ts">
	import { ref, reactive, onMounted } from "vue";
	import { ArrowLeft, User, Upload } from "@element-plus/icons-vue";
	import { useRouter } from "vue-router";
	import { ElMessage } from "element-plus";
	import type { FormInstance, FormRules } from "element-plus";
	import { useAuthStore } from "../stores/authStore";
	import { getProfile, updateProfile } from "../api/profile";
	import { uploadImage } from "../api/upload";
	import areaData from "china-area-data";

	const router = useRouter();
	const authStore = useAuthStore();
	const formRef = ref<FormInstance>();
	const loading = ref(true);
	const saving = ref(false);
	const avatarUrl = ref<string | null>(null);

	const formData = reactive({
		username: "",
		bio: "",
		address: [] as string[],
		gender: "",
	});

	const rules: FormRules = {
		username: [
			{ required: true, message: "请输入昵称", trigger: "blur" },
			{ min: 2, max: 20, message: "昵称长度为2-20个字符", trigger: "blur" },
		],
	};

	// 级联选择器选项
	interface CascaderOption {
		value: string;
		label: string;
		children?: CascaderOption[];
	}

	function buildAreaOptions(parentCode = "86"): CascaderOption[] {
		const children = (areaData as Record<string, Record<string, string>>)[parentCode];
		if (!children || typeof children !== "object") return [];

		return Object.entries(children).map(([code, name]) => {
			const option: CascaderOption = { value: code, label: name };
			const sub = buildAreaOptions(code);
			if (sub.length > 0) {
				option.children = sub;
			}
			return option;
		});
	}

	const areaOptions = ref<CascaderOption[]>(buildAreaOptions());

	async function handleUpload(file: File): Promise<boolean> {
		try {
			const url = await uploadImage(file);
			avatarUrl.value = url;
			ElMessage.success("头像上传成功");
		} catch {
			ElMessage.error("头像上传失败");
		}
		return false;
	}

	async function handleSave() {
		if (!formRef.value) return;
		const valid = await formRef.value.validate().catch(() => false);
		if (!valid) return;

		saving.value = true;
		try {
			const updated = await updateProfile({
				username: formData.username,
				bio: formData.bio,
				address: Array.isArray(formData.address) ? formData.address.join(",") : formData.address,
				gender: formData.gender,
				avatarUrl: avatarUrl.value || undefined,
			});
			authStore.setUser({ ...authStore.user!, ...updated });
			ElMessage.success("个人资料已更新");
			router.push("/");
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			ElMessage.error(err.response?.data?.message || "保存失败");
		} finally {
			saving.value = false;
		}
	}

	onMounted(async () => {
		try {
			const profile = await getProfile();
			formData.username = profile.username;
			formData.bio = profile.bio || "";
			formData.address = profile.address ? profile.address.split(",") : [];
			formData.gender = profile.gender || "";
			avatarUrl.value = profile.avatarUrl;
		} catch {
			ElMessage.error("加载个人资料失败");
		} finally {
			loading.value = false;
		}
	});
</script>

<style scoped lang="scss">
	.profile-edit-page {
		max-width: 600px;
		margin: 0 auto;
	}

	.profile-edit-back {
		margin-bottom: 16px;
	}

	.profile-edit-avatar-section {
		text-align: center;
		margin-bottom: 24px;
	}

	.profile-edit-avatar-upload {
		margin-top: 12px;
	}

	/* 暗黑主题支持 */
	.dark-theme .profile-edit-page h4 {
		color: #e8e8e8 !important;
	}

	.dark-theme .profile-edit-back {
		color: #bfbfbf !important;
	}

	.dark-theme .profile-edit-page :deep(.el-select .el-input__wrapper) {
		background-color: #2a2a2a !important;
	}

	.dark-theme .profile-edit-page :deep(.el-cascader .el-input__wrapper) {
		background-color: #2a2a2a !important;
	}

	.dark-theme .profile-edit-avatar-section {
		border-color: #303030 !important;
	}
</style>
