import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import AppLayout from './components/AppLayout';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
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

  return <PublicTripDetailPage />;
}

export default function App() {
  const mode = useThemeStore((s) => s.mode);

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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
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
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}