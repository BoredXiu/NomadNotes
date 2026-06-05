import { defineStore } from "pinia";
import { ref } from "vue";

type ThemeMode = "light" | "dark";

const getInitialTheme = (): ThemeMode => {
  try {
    const stored = localStorage.getItem("theme-mode");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // ignore
  }
  return "light";
};

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>(getInitialTheme());

  function setMode(newMode: ThemeMode) {
    localStorage.setItem("theme-mode", newMode);
    mode.value = newMode;
  }

  function toggleTheme() {
    const newMode = mode.value === "light" ? "dark" : "light";
    localStorage.setItem("theme-mode", newMode);
    mode.value = newMode;
  }

  return { mode, setMode, toggleTheme };
});