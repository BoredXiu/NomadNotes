import axios from "axios";
import { getAccessToken, getRefreshToken, getCurrentUserId, setAccessToken, setRefreshToken, logoutCurrentUser } from "../utils/storage";

// API 基础地址：优先使用环境变量，未配置时默认使用 /api（走 Vite 开发代理）
const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
	timeout: 15000,
	headers: {
		"Content-Type": "application/json",
	},
});

/**
 * 请求拦截器：自动附加当前用户的 Authorization header
 *
 * 多用户 localStorage 方案：
 * - 通过 getCurrentUserId() 确定当前活跃用户
 * - 从 nn_accessToken_{uid} 读取对应 token
 * - 不同用户登录时 token 存储在各自 key 下，互不覆盖
 */
api.interceptors.request.use((config) => {
	const token = getAccessToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

/**
 * 响应拦截器：统一处理 401 刷新、403 账号禁用
 *
 * 多用户 localStorage 方案：
 * - 刷新 token 后写入当前用户的 key（nn_accessToken_{uid}）
 * - 登出时只清除当前用户数据，不影响其他用户
 */
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// 处理账号被禁用的情况（403 + 特定消息）
		// 不在每个调用处单独处理，统一在此处清除登录状态并提示用户
		if (error.response?.status === 403) {
			const message = error.response?.data?.message || "";
			if (message.includes("已被管理员禁用")) {
				logoutCurrentUser();
				// 通过 URL 参数传递禁用提示，避免刷新后丢失
				window.location.href = "/login?disabled=1";
				return Promise.reject(error);
			}
		}

		if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== "/auth/refresh") {
			originalRequest._retry = true;
			try {
				const refreshToken = getRefreshToken();
				if (!refreshToken) {
					throw new Error("No refresh token");
				}

				const { data } = await axios.post("/api/auth/refresh", {
					refreshToken,
				});

				if (data.success) {
					const { accessToken, refreshToken: newRefreshToken } = data.data;
					// 获取当前活跃用户 ID 后写入对应 key
					const uid = getCurrentUserId();
					if (uid) {
						setAccessToken(uid, accessToken);
						setRefreshToken(uid, newRefreshToken);
					}
					originalRequest.headers.Authorization = `Bearer ${accessToken}`;
					return api(originalRequest);
				}
			} catch (refreshError) {
				logoutCurrentUser();
				window.location.href = "/login";
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default api;
