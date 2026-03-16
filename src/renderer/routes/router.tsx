import { MemoryRouter, Route, Routes, Navigate, Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import AuthGuard from './AuthGuard';
import AppShell from '../components/layout/AppShell';
import GeneratePage from '../pages/GeneratePage';
import SettingsPage from '../pages/SettingsPage';
import AuthLoginPage from '../pages/AuthLoginPage';

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={['/generate']}>
        <Routes>
          <Route path="/auth/login" element={<AuthLoginPage />} />
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/generate" replace />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}
