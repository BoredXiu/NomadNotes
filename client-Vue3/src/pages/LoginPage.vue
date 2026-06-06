<template>
	<div
		:style="{
			minHeight: '100vh',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundImage: `url(${bgLogin})`,
			backgroundPosition: 'center',
			backgroundSize: 'cover',
			backgroundRepeat: 'no-repeat',
		}"
	>
		<el-card
			ref="formRef_gsap"
			style="width: 400px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15)"
		>
			<el-space
				direction="vertical"
				:size="24"
				style="width: 100%"
				alignment="center"
			>
				<div style="text-align: center">
					<h2
						class="login-page-title"
						style="margin: 0 0 4px 0; font-size: 30px; font-weight: 600; line-height: 1.35"
					>
						NomadNotes
					</h2>
					<div
						class="login-page-subtitle"
						style="color: rgba(0, 0, 0, 0.45); font-size: 14px; margin-bottom: 8px"
					>
						游迹 - 记录每一段旅程
					</div>
				</div>

				<el-form
					ref="formRef"
					:model="formData"
					:rules="rules"
					label-position="top"
					style="width: 100%"
					@submit.prevent="handleLogin"
				>
					<el-form-item prop="account">
						<el-input
							v-model="formData.account"
							:prefix-icon="Message"
							placeholder="邮箱或用户名"
							size="large"
						/>
					</el-form-item>

					<el-form-item prop="password">
						<el-input
							v-model="formData.password"
							:prefix-icon="Lock"
							type="password"
							placeholder="密码"
							size="large"
							show-password
						/>
					</el-form-item>

					<el-form-item prop="captchaText">
						<div style="display: flex; gap: 8px; width: 100%">
							<el-input
								v-model="formData.captchaText"
								:prefix-icon="Key"
								placeholder="验证码"
								size="large"
								style="width: 60%"
							/>
							<div
								style="width: 38%; cursor: pointer; height: 40px; flex-shrink: 0"
								@click="fetchCaptcha"
								v-html="captchaSvg"
							/>
						</div>
					</el-form-item>

					<el-form-item>
						<el-button
							type="primary"
							:loading="loading"
							native-type="submit"
							size="large"
							style="font-size: 16px; height: 40px; width: 100%"
						>
							登录
						</el-button>
					</el-form-item>
				</el-form>

				<div style="text-align: center">
					<el-link
						type="primary"
						@click="router.push('/register')"
					>
						还没有账号？立即注册
					</el-link>
				</div>
			</el-space>
		</el-card>
	</div>
</template>

<script setup lang="ts">
	import { ref, reactive, onMounted } from "vue";
	import { Message, Lock, Key } from "@element-plus/icons-vue";
	import { useRouter } from "vue-router";
	import { ElMessage } from "element-plus";
	import type { FormInstance, FormRules } from "element-plus";
	import * as authApi from "../api/auth";
	import { useAuthStore } from "../stores/authStore";
	import bgLogin from "../assets/bg-login.jpg";
	import { useFadeIn } from "../composables/useGsapAnimations";

	const router = useRouter();
	const authStore = useAuthStore();
	const formRef = ref<FormInstance>();
	const loading = ref(false);
	const captchaSvg = ref("");

	// GSAP 动画
	const formRef_gsap = useFadeIn(0.2);
	const captchaId = ref("");

	const formData = reactive({
		account: "",
		password: "",
		captchaText: "",
	});

	const rules: FormRules = {
		account: [{ required: true, message: "请输入邮箱或用户名", trigger: "blur" }],
		password: [{ required: true, message: "请输入密码", trigger: "blur" }],
		captchaText: [{ required: true, message: "请输入验证码", trigger: "blur" }],
	};

	async function fetchCaptcha() {
		try {
			const data = await authApi.getCaptcha();
			captchaSvg.value = data.svg;
			captchaId.value = data.captchaId;
		} catch {
			ElMessage.error("获取验证码失败");
		}
	}

	async function handleLogin() {
		if (!formRef.value) return;
		const valid = await formRef.value.validate().catch(() => false);
		if (!valid) return;

		loading.value = true;
		try {
			const result = await authApi.login({
				account: formData.account,
				password: formData.password,
				captchaId: captchaId.value,
				captchaText: formData.captchaText,
			});
			authStore.login(result.user, result.accessToken, result.refreshToken);
			ElMessage.success("登录成功");
			router.push("/");
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			ElMessage.error(err?.response?.data?.message || "登录失败");
			fetchCaptcha();
		} finally {
			loading.value = false;
		}
	}

	onMounted(() => {
		fetchCaptcha();
	});
</script>

<style scoped lang="scss">
	/* 暗黑主题支持 */
	.dark-theme .login-page-title {
		color: #e8e8e8 !important;
	}

	.dark-theme .login-page-subtitle {
		color: rgba(255, 255, 255, 0.45) !important;
	}
</style>
