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
						:teleported="false"
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
						:teleported="false"
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

				<!-- 密码修改区域 -->
				<el-divider
					content-position="left"
					style="font-size: 0.875rem; color: #888"
				>
					密码修改
				</el-divider>

				<el-collapse
					v-model="passwordCollapseActive"
					style="border: none"
				>
					<el-collapse-item
						name="password"
						:title="passwordCollapseTitle"
					>
						<el-form
							ref="passwordFormRef"
							:model="passwordForm"
							:rules="passwordRules"
							label-position="top"
						>
							<el-form-item
								prop="currentPassword"
								label="当前密码"
							>
								<el-input
									v-model="passwordForm.currentPassword"
									type="password"
									placeholder="请输入当前密码"
									show-password
								/>
							</el-form-item>

							<el-form-item
								prop="newPassword"
								label="新密码"
							>
								<el-input
									v-model="passwordForm.newPassword"
									type="password"
									placeholder="请输入新密码（至少 6 位，包含字母和数字）"
									show-password
									@input="handleNewPasswordInput"
								/>
							</el-form-item>

							<!-- 密码强度指示条 -->
							<div
								v-if="passwordStrength > 0"
								class="password-strength-bar"
							>
								<el-progress
									:percentage="getStrengthInfo.percent"
									:stroke-color="getStrengthInfo.color"
									:show-text="false"
									:stroke-width="6"
								/>
								<span
									class="password-strength-text"
									:style="{ color: getStrengthInfo.color }"
								>
									密码强度：{{ getStrengthInfo.text }}
								</span>
							</div>

							<el-form-item
								prop="confirmPassword"
								label="确认新密码"
							>
								<el-input
									v-model="passwordForm.confirmPassword"
									type="password"
									placeholder="请再次输入新密码"
									show-password
								/>
							</el-form-item>

							<el-form-item>
								<el-button
									type="primary"
									:loading="passwordSaving"
									@click="handleChangePassword"
									plain
									block
								>
									保存修改
								</el-button>
							</el-form-item>
						</el-form>
					</el-collapse-item>
				</el-collapse>

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
	import { ref, reactive, computed, onMounted } from "vue";
	import { ArrowLeft, User, Upload } from "@element-plus/icons-vue";
	import { useRouter } from "vue-router";
	import { ElMessage } from "element-plus";
	import type { FormInstance, FormRules } from "element-plus";
	import { useAuthStore } from "../stores/authStore";
	import { getProfile, updateProfile, changePassword } from "../api/profile";
	import { uploadImage } from "../api/upload";
	import areaData from "china-area-data";

	const router = useRouter();
	const authStore = useAuthStore();
	const formRef = ref<FormInstance>();
	const passwordFormRef = ref<FormInstance>();
	const loading = ref(true);
	const saving = ref(false);
	const passwordSaving = ref(false);
	const avatarUrl = ref<string | null>(null);
	const passwordStrength = ref(0);
	const passwordCollapseActive = ref<string[]>([]);

	const passwordCollapseTitle = computed(() => "修改密码");

	const formData = reactive({
		username: "",
		bio: "",
		address: [] as string[],
		gender: "",
	});

	const passwordForm = reactive({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const rules: FormRules = {
		username: [
			{ required: true, message: "请输入昵称", trigger: "blur" },
			{ min: 2, max: 20, message: "昵称长度为2-20个字符", trigger: "blur" },
		],
	};

	/** 密码表单校验规则 */
	const passwordRules: FormRules = {
		currentPassword: [{ required: true, message: "请输入当前密码", trigger: "blur" }],
		newPassword: [
			{ required: true, message: "请输入新密码", trigger: "blur" },
			{ min: 6, message: "密码长度至少 6 位", trigger: "blur" },
			{
				pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
				message: "密码必须包含字母和数字",
				trigger: "blur",
			},
		],
		confirmPassword: [
			{ required: true, message: "请再次输入新密码", trigger: "blur" },
			{
				validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
					if (value !== passwordForm.newPassword) {
						callback(new Error("两次输入的密码不一致"));
					} else {
						callback();
					}
				},
				trigger: "blur",
			},
		],
	};

	/** 计算密码强度等级（0-100） */
	function calcPasswordStrength(pwd: string): number {
		let score = 0;
		if (pwd.length >= 6) score += 20;
		if (pwd.length >= 10) score += 20;
		if (/[a-z]/.test(pwd)) score += 15;
		if (/[A-Z]/.test(pwd)) score += 15;
		if (/\d/.test(pwd)) score += 15;
		if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;
		return Math.min(score, 100);
	}

	/** 密码强度信息和颜色 */
	const getStrengthInfo = computed(() => {
		const score = passwordStrength.value;
		if (score === 0) return { text: "", color: "", percent: 0 };
		if (score < 40) return { text: "弱", color: "#ff4d4f", percent: 25 };
		if (score < 60) return { text: "中", color: "#faad14", percent: 50 };
		if (score < 80) return { text: "强", color: "#52c41a", percent: 75 };
		return { text: "非常强", color: "#52c41a", percent: 100 };
	});

	/** 新密码输入时更新强度指示 */
	function handleNewPasswordInput(value: string) {
		passwordStrength.value = calcPasswordStrength(value);
	}

	/** 修改密码 */
	async function handleChangePassword() {
		if (!passwordFormRef.value) return;
		const valid = await passwordFormRef.value.validate().catch(() => false);
		if (!valid) return;

		passwordSaving.value = true;
		try {
			await changePassword({
				currentPassword: passwordForm.currentPassword,
				newPassword: passwordForm.newPassword,
			});
			ElMessage.success("密码修改成功");
			passwordForm.currentPassword = "";
			passwordForm.newPassword = "";
			passwordForm.confirmPassword = "";
			passwordStrength.value = 0;
			passwordCollapseActive.value = [];
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			ElMessage.error(err.response?.data?.message || "密码修改失败");
		} finally {
			passwordSaving.value = false;
		}
	}

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

	/* 暗黑主题表单标签 */
	.dark-theme .profile-edit-page :deep(.el-form-item__label) {
		color: #bfbfbf !important;
	}

	/* 暗黑主题更换头像按钮 */
	.dark-theme .profile-edit-avatar-upload :deep(.el-button--default) {
		background-color: #2a2a2a !important;
		border-color: #3a3a3a !important;
		color: #e8e8e8 !important;
	}

	.dark-theme .profile-edit-avatar-upload :deep(.el-button--default:hover) {
		background-color: #3a3a3a !important;
		border-color: #505050 !important;
		color: #fff !important;
	}

	/* 暗黑主题输入框 */
	.dark-theme .profile-edit-page :deep(.el-input__wrapper) {
		background-color: #2a2a2a !important;
		box-shadow: 0 0 0 1px #3a3a3a inset !important;
	}

	.dark-theme .profile-edit-page :deep(.el-input__inner) {
		color: #e8e8e8 !important;
	}

	/* 暗黑主题文本框 */
	.dark-theme .profile-edit-page :deep(.el-textarea__inner) {
		background-color: #2a2a2a !important;
		color: #e8e8e8 !important;
		border-color: #3a3a3a !important;
	}

	/* 暗黑主题 Select 选择器 */
	.dark-theme .profile-edit-page :deep(.el-select .el-input__wrapper) {
		background-color: #2a2a2a !important;
	}

	.dark-theme .profile-edit-page :deep(.el-select-dropdown__item) {
		color: #e8e8e8 !important;
	}

	.dark-theme .profile-edit-page :deep(.el-select-dropdown__item:hover) {
		background-color: #3a3a3a !important;
	}

	.dark-theme .profile-edit-page :deep(.el-select-dropdown__item.is-selected) {
		color: #667eea !important;
		background-color: #1f1f1f !important;
	}

	/* 暗黑主题 Cascader 级联选择器 */
	.dark-theme .profile-edit-page :deep(.el-cascader .el-input__wrapper) {
		background-color: #2a2a2a !important;
	}

	.dark-theme .profile-edit-page :deep(.el-cascader-node__label) {
		color: #e8e8e8 !important;
	}

	.dark-theme .profile-edit-page :deep(.el-cascader-node:not(.is-disabled):hover) {
		background-color: #3a3a3a !important;
	}

	.dark-theme .profile-edit-avatar-section {
		border-color: #303030 !important;
	}

	/* 密码强度指示条 */
	.password-strength-bar {
		margin-top: -0.5rem;
		margin-bottom: 1.25rem;
	}

	.password-strength-text {
		font-size: 0.75rem;
		margin-top: 0.25rem;
		display: inline-block;
	}

	/* 密码折叠面板样式 */
	.profile-edit-card :deep(.el-collapse-item__header) {
		font-size: 0.875rem;
		color: #666;
	}

	.dark-theme .profile-edit-card :deep(.el-collapse-item__header) {
		color: #bfbfbf !important;
	}

	.dark-theme .profile-edit-card :deep(.el-collapse-item__wrap) {
		background: transparent !important;
	}

	.dark-theme .profile-edit-card :deep(.el-divider__text) {
		color: #888 !important;
	}

	/* 暗黑主题密码强度进度条 */
	.dark-theme .password-strength-bar :deep(.el-progress-bar__outer) {
		background-color: #2a2a2a !important;
	}

	.dark-theme .password-strength-text {
		color: #bfbfbf !important;
	}
</style>
