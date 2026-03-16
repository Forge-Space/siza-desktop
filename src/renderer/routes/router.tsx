import { MemoryRouter, Route, Routes, Navigate, Outlet } from 'react-router';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import AuthGuard from './AuthGuard';
import AppShell from '../components/layout/AppShell';
import GeneratePage from '../pages/GeneratePage';
import SettingsPage from '../pages/SettingsPage';
import AuthLoginPage from '../pages/AuthLoginPage';
import OnboardingPage from '../pages/OnboardingPage';
import UpdateBanner from '../components/UpdateBanner';
import { ModelManagerPage } from '../pages/ModelManagerPage';
import HistoryPage from '../pages/HistoryPage';

function AppLayout() {
  return (
    <>
      <UpdateBanner />
      <AppShell>
        <Outlet />
      </AppShell>
    </>
  );
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    window.desktop.onboarding.getState()
      .then((s) => {
        setNeedsOnboarding(!s.completed);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  if (!checked) return null;
  if (needsOnboarding) return <OnboardingPage />;
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={['/generate']}>
        <OnboardingGate>
          <Routes>
            <Route path="/auth/login" element={<AuthLoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<AuthGuard />}>
              <Route element={<AppLayout />}>
                <Route path="/generate" element={<GeneratePage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/models" element={<ModelManagerPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/generate" replace />} />
              </Route>
            </Route>
          </Routes>
        </OnboardingGate>
      </MemoryRouter>
    </AuthProvider>
  );
}
