import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "../types";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const isAuthenticated = computed(
    () => !!localStorage.getItem("accessToken"),
  );

  function setUser(newUser: User | null) {
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    }
    user.value = newUser;
  }

  function login(
    newUser: User,
    accessToken: string,
    refreshToken: string,
  ) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    user.value = newUser;
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    user.value = null;
  }

  return { user, isAuthenticated, setUser, login, logout };
});