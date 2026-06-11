import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	// 管理员判断：根据用户角色字段
	isAdmin: () => boolean;
	setUser: (user: User | null) => void;
	login: (user: User, accessToken: string, refreshToken: string) => void;
	logout: () => void;
}

// 使用 sessionStorage 而非 localStorage 实现同浏览器多账号隔离
// sessionStorage 每个标签页独立，不同标签页登录不同账号不会互相覆盖 token

export const useAuthStore = create<AuthState>((set, get) => ({
	user: JSON.parse(sessionStorage.getItem("user") || "null"),
	isAuthenticated: !!sessionStorage.getItem("accessToken"),

	isAdmin: () => {
		const u = get().user;
		return u != null && (u as User).role === "admin";
	},

	setUser: (user) => {
		if (user) {
			sessionStorage.setItem("user", JSON.stringify(user));
		}
		set({ user });
	},

	login: (user, accessToken, refreshToken) => {
		sessionStorage.setItem("accessToken", accessToken);
		sessionStorage.setItem("refreshToken", refreshToken);
		sessionStorage.setItem("user", JSON.stringify(user));
		set({ user, isAuthenticated: true });
	},

	logout: () => {
		sessionStorage.removeItem("accessToken");
		sessionStorage.removeItem("refreshToken");
		sessionStorage.removeItem("user");
		set({ user: null, isAuthenticated: false });
	},
}));
