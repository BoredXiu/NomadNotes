import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "../types";
import { getStoredUser, getAccessToken, saveAuth, logoutCurrentUser, setCurrentUserId } from "../utils/storage";

/**
 * 认证状态管理（Pinia）
 *
 * 多用户 localStorage 方案：
 * - 初始化时从 localStorage 读取当前活跃用户的信息和 token
 * - nn_currentUserId 决定当前哪个用户的 token 生效
 * - 登录时调用 saveAuth 将数据按用户级 key 存储
 * - 登出时调用 logoutCurrentUser 清除当前用户数据
 */
export const useAuthStore = defineStore("auth", () => {
	// 从 localStorage 多 key 方案读取当前用户状态
	const storedUser = getStoredUser();
	const user = ref<User | null>(storedUser as User | null);
	const isAuthenticated = ref(!!getAccessToken());

	// 管理员判断：根据用户角色字段
	const isAdmin = computed(() => user.value?.role === "admin");

	function setUser(newUser: User | null) {
		user.value = newUser;
		// setUser 仅更新内存状态，不自动写 localStorage
		// 由 login 函数统一负责持久化
	}

	function login(newUser: User, accessToken: string, refreshToken: string) {
		// 使用多用户 localStorage 存储
		saveAuth(newUser as unknown as Record<string, unknown>, accessToken, refreshToken);
		user.value = newUser;
		isAuthenticated.value = true;
	}

	function logout() {
		// 清除当前用户所有 localStorage 数据
		logoutCurrentUser();
		user.value = null;
		isAuthenticated.value = false;
	}

	/**
	 * 切换到指定用户
	 * 更新 nn_currentUserId，加载对应 token 和用户信息到内存
	 */
	function switchToUser(uid: string) {
		setCurrentUserId(uid);
		const targetUser = getStoredUser(uid);
		const token = getAccessToken(uid);
		if (targetUser && token) {
			user.value = targetUser as unknown as User | null;
			isAuthenticated.value = true;
		}
	}

	return { user, isAuthenticated, isAdmin, setUser, login, logout, switchToUser };
});
