import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const TripFormPage = lazy(() => import('./pages/TripFormPage'));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'));
const ExpenseFormPage = lazy(() => import('./pages/ExpenseFormPage'));
const NoteFormPage = lazy(() => import('./pages/NoteFormPage'));
const NoteDetailPage = lazy(() => import('./pages/NoteDetailPage'));
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const PublicTripDetailPage = lazy(() => import('./pages/PublicTripDetailPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spin size="large" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#667eea',
            borderRadius: 8,
          },
        }}
      >
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/public-trip/:id" element={<PublicTripDetailPage />} />
                <Route path="/profile" element={<ProfileEditPage />} />
                <Route path="/trip/new" element={<TripFormPage />} />
                <Route path="/trip/:id" element={<TripDetailPage />} />
                <Route path="/trip/:id/edit" element={<TripFormPage />} />
                <Route
                  path="/trip/:id/expense/new"
                  element={<ExpenseFormPage />}
                />
                <Route
                  path="/trip/:tripId/expense/:expenseId/edit"
                  element={<ExpenseFormPage />}
                />
                <Route path="/trip/:id/note/new" element={<NoteFormPage />} />
                <Route
                  path="/trip/:tripId/note/:noteId/edit"
                  element={<NoteFormPage />}
                />
                <Route
                  path="/trip/:tripId/note/:noteId"
                  element={<NoteDetailPage />}
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}