import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "../types";

// 使用 sessionStorage 而非 localStorage 实现同浏览器多账号隔离
// sessionStorage 每个标签页独立，不同标签页登录不同账号不会互相覆盖 token
export const useAuthStore = defineStore("auth", () => {
	const user = ref<User | null>(JSON.parse(sessionStorage.getItem("user") || "null"));
	const isAuthenticated = ref(!!sessionStorage.getItem("accessToken"));

	// 管理员判断：根据用户角色字段
	const isAdmin = computed(() => user.value?.role === "admin");

	function setUser(newUser: User | null) {
		if (newUser) {
			sessionStorage.setItem("user", JSON.stringify(newUser));
		}
		user.value = newUser;
	}

	function login(newUser: User, accessToken: string, refreshToken: string) {
		sessionStorage.setItem("accessToken", accessToken);
		sessionStorage.setItem("refreshToken", refreshToken);
		sessionStorage.setItem("user", JSON.stringify(newUser));
		user.value = newUser;
		isAuthenticated.value = true;
	}

	function logout() {
		sessionStorage.removeItem("accessToken");
		sessionStorage.removeItem("refreshToken");
		sessionStorage.removeItem("user");
		user.value = null;
		isAuthenticated.value = false;
	}

	return { user, isAuthenticated, isAdmin, setUser, login, logout };
});
