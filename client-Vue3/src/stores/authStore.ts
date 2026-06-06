import { defineStore } from "pinia";
import { ref } from "vue";
import type { User } from "../types";

export const useAuthStore = defineStore("auth", () => {
	const user = ref<User | null>(JSON.parse(localStorage.getItem("user") || "null"));
	// 使用 ref 而非 computed，确保 localStorage 变更后能响应式更新
	const isAuthenticated = ref(!!localStorage.getItem("accessToken"));

	function setUser(newUser: User | null) {
		if (newUser) {
			localStorage.setItem("user", JSON.stringify(newUser));
		}
		user.value = newUser;
	}

	function login(newUser: User, accessToken: string, refreshToken: string) {
		localStorage.setItem("accessToken", accessToken);
		localStorage.setItem("refreshToken", refreshToken);
		localStorage.setItem("user", JSON.stringify(newUser));
		user.value = newUser;
		isAuthenticated.value = true;
	}

	function logout() {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refreshToken");
		localStorage.removeItem("user");
		user.value = null;
		isAuthenticated.value = false;
	}

	return { user, isAuthenticated, setUser, login, logout };
});
