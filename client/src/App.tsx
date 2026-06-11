import React, { useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import AppLayout from './components/AppLayout';
import AppFooter from './components/AppFooter';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ExplorePage from './pages/ExplorePage';
import PublicTripDetailPage from './pages/PublicTripDetailPage';
import ProfileEditPage from './pages/ProfileEditPage';
import HomePage from './pages/HomePage';
import TripDetailPage from './pages/TripDetailPage';
import ExpenseFormPage from './pages/ExpenseFormPage';
import NoteFormPage from './pages/NoteFormPage';
import TripFormPage from './pages/TripFormPage';
import SearchResultsPage from './pages/SearchResultsPage';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// 路由守卫：未登录用户重定向到登录页
function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// 路由守卫：已登录用户重定向到"我的旅程"首页
function GuestGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicTripRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return (
      <AppLayout>
        <PublicTripDetailPage />
      </AppLayout>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        <PublicTripDetailPage />
      </div>
      <AppFooter />
    </div>
  );
}

export default function App() {
  const mode = useThemeStore((s) => s.mode);

  // 同步暗黑主题类名到 document.body
  useEffect(() => {
    if (mode === 'dark') {
      document.body.classList.add('dark-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.documentElement.removeAttribute('data-theme');
    }
  }, [mode]);

  const themeConfig = useMemo(
    () => ({
      algorithm: mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      token: {
        colorPrimary: '#667eea',
        borderRadius: 8,
      },
    }),
    [mode]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={themeConfig} locale={zhCN}>
        <AntApp>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
              <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
              <Route path="/public-trip/:id" element={<PublicTripRoute />} />
              <Route
                element={
                  <AuthGuard>
                    <AppLayout />
                  </AuthGuard>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/profile" element={<ProfileEditPage />} />
                <Route path="/trip/new" element={<TripFormPage />} />
                <Route path="/trip/:id" element={<TripDetailPage />} />
                <Route path="/trip/:id/edit" element={<TripFormPage />} />
                <Route path="/trip/:tripId/expense/new" element={<ExpenseFormPage />} />
                <Route path="/trip/:tripId/expense/:expenseId/edit" element={<ExpenseFormPage />} />
                <Route path="/trip/:tripId/note/new" element={<NoteFormPage />} />
                <Route path="/trip/:tripId/note/:noteId/edit" element={<NoteFormPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}