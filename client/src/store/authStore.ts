import { create } from "zustand";
import type { User } from "../types";
import { getStoredUser, getAccessToken, saveAuth, logoutCurrentUser } from "../utils/storage";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	// 管理员判断：根据用户角色字段
	isAdmin: () => boolean;
	setUser: (user: User | null) => void;
	login: (user: User, accessToken: string, refreshToken: string) => void;
	logout: () => void;
}

/**
 * 认证状态管理
 *
 * 多用户 localStorage 方案：
 * - 初始化时从 localStorage 读取当前活跃用户的信息和 token
 * - nn_currentUserId 决定当前哪个用户的 token 生效
 * - 登录时调用 saveAuth 将数据按用户级 key 存储
 * - 登出时调用 logoutCurrentUser 清除当前用户数据
 */

export const useAuthStore = create<AuthState>((set, get) => ({
	// 从 localStorage 多 key 方案读取当前用户状态
	user: getStoredUser() as User | null,
	isAuthenticated: !!getAccessToken(),

	isAdmin: () => {
		const u = get().user;
		return u != null && (u as User).role === "admin";
	},

	setUser: (user) => {
		set({ user });
		// setUser 仅更新内存状态，不自动写 localStorage
		// 由 login 函数统一负责持久化
	},

	login: (user, accessToken, refreshToken) => {
		// 使用多用户 localStorage 存储
		saveAuth(user as unknown as Record<string, unknown>, accessToken, refreshToken);
		set({ user, isAuthenticated: true });
	},

	logout: () => {
		// 清除当前用户所有 localStorage 数据
		logoutCurrentUser();
		set({ user: null, isAuthenticated: false });
	},
}));
