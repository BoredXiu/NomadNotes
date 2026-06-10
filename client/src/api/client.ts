import axios from "axios";

// API 基础地址：优先使用环境变量，未配置时默认使用 /api（走 Vite 开发代理）
const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
	timeout: 15000,
	headers: {
		"Content-Type": "application/json",
	},
});

// 使用 sessionStorage 而非 localStorage 实现同浏览器多账号隔离
// sessionStorage 每个标签页独立，避免不同标签页登录不同账号时 token 互相覆盖
api.interceptors.request.use((config) => {
	const token = sessionStorage.getItem("accessToken");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// 处理账号被禁用的情况（403 + 特定消息）
		// 不在每个调用处单独处理，统一在此处清除登录状态并提示用户
		if (error.response?.status === 403) {
			const message = error.response?.data?.message || "";
			if (message.includes("已被管理员禁用")) {
				sessionStorage.removeItem("accessToken");
				sessionStorage.removeItem("refreshToken");
				sessionStorage.removeItem("user");
				// 通过 URL 参数传递禁用提示，避免刷新后丢失
				window.location.href = "/login?disabled=1";
				return Promise.reject(error);
			}
		}

		if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== "/auth/refresh") {
			originalRequest._retry = true;
			try {
				const refreshToken = sessionStorage.getItem("refreshToken");
				if (!refreshToken) {
					throw new Error("No refresh token");
				}

				const { data } = await axios.post("/api/auth/refresh", { refreshToken });

				if (data.success) {
					const { accessToken, refreshToken: newRefreshToken } = data.data;
					sessionStorage.setItem("accessToken", accessToken);
					sessionStorage.setItem("refreshToken", newRefreshToken);
					originalRequest.headers.Authorization = `Bearer ${accessToken}`;
					return api(originalRequest);
				}
			} catch (refreshError) {
				sessionStorage.removeItem("accessToken");
				sessionStorage.removeItem("refreshToken");
				sessionStorage.removeItem("user");
				window.location.href = "/login";
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default api;
