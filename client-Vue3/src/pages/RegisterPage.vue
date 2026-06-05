<template>
	<div style="min-height: 100vh; display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
		<el-card style="width: 400px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15)">
			<el-space
				direction="vertical"
				:size="24"
				style="width: 100%"
				alignment="center"
			>
				<div style="text-align: center">
					<h2 style="margin: 0 0 4px 0; font-size: 30px; font-weight: 600; line-height: 1.35">NomadNotes</h2>
					<div style="color: rgba(0, 0, 0, 0.45); font-size: 14px; margin-bottom: 8px">游迹 - 创建你的账号</div>
				</div>

				<el-form
					ref="formRef"
					:model="formData"
					:rules="rules"
					label-position="top"
					style="width: 100%"
					@submit.prevent="handleRegister"
				>
					<el-form-item prop="username">
						<el-input
							v-model="formData.username"
							:prefix-icon="User"
							placeholder="用户名"
							size="large"
						/>
					</el-form-item>

					<el-form-item prop="email">
						<el-input
							v-model="formData.email"
							:prefix-icon="Message"
							placeholder="邮箱"
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
							block
							size="large"
							style="font-size: 16px; height: 40px"
						>
							注册
						</el-button>
					</el-form-item>
				</el-form>

				<div style="text-align: center">
					<el-link
						type="primary"
						@click="router.push('/login')"
					>
						已有账号？立即登录
					</el-link>
				</div>
			</el-space>
		</el-card>
	</div>
</template>

<script setup lang="ts">
	import { ref, reactive, onMounted } from "vue";
	import { Message, Lock, Key, User } from "@element-plus/icons-vue";
	import { useRouter } from "vue-router";
	import { ElMessage } from "element-plus";
	import type { FormInstance, FormRules } from "element-plus";
	import * as authApi from "../api/auth";
	import { useAuthStore } from "../stores/authStore";

	const router = useRouter();
	const authStore = useAuthStore();
	const formRef = ref<FormInstance>();
	const loading = ref(false);
	const captchaSvg = ref("");
	const captchaId = ref("");

	const formData = reactive({
		username: "",
		email: "",
		password: "",
		captchaText: "",
	});

	const rules: FormRules = {
		username: [
			{ required: true, message: "请输入用户名", trigger: "blur" },
			{ min: 2, max: 50, message: "用户名长度需在 2-50 之间", trigger: "blur" },
		],
		email: [
			{ required: true, message: "请输入邮箱", trigger: "blur" },
			{ type: "email", message: "邮箱格式不正确", trigger: "blur" },
		],
		password: [
			{ required: true, message: "请输入密码", trigger: "blur" },
			{ min: 6, message: "密码长度至少 6 位", trigger: "blur" },
		],
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

	async function handleRegister() {
		if (!formRef.value) return;
		const valid = await formRef.value.validate().catch(() => false);
		if (!valid) return;

		loading.value = true;
		try {
			const result = await authApi.register({
				username: formData.username,
				email: formData.email,
				password: formData.password,
				captchaId: captchaId.value,
				captchaText: formData.captchaText,
			});
			authStore.login(result.user, result.accessToken, result.refreshToken);
			ElMessage.success("注册成功");
			router.push("/");
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			ElMessage.error(err?.response?.data?.message || "注册失败");
			fetchCaptcha();
		} finally {
			loading.value = false;
		}
	}

	onMounted(() => {
		fetchCaptcha();
	});
</script>
