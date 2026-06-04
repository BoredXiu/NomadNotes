import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): ThemeMode => {
  try {
    const stored = localStorage.getItem('theme-mode');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // ignore
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: getInitialTheme(),
  setMode: (mode) => {
    localStorage.setItem('theme-mode', mode);
    set({ mode });
  },
  toggleTheme: () => {
    set((state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-mode', newMode);
      return { mode: newMode };
    });
  },
}));