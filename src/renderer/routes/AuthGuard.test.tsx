import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import AuthGuard from './AuthGuard';

const mockSession = { email: 'u@test.com', accessToken: 'tok', refreshToken: 'ref', userId: 'u1' };

function Wrapper({ initialPath = '/protected' }: { initialPath?: string }) {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/auth/login" element={<div>Login Page</div>} />
          <Route element={<AuthGuard />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('AuthGuard', () => {
  it('shows spinner while loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resolve: (v: any) => void;
    vi.mocked(window.desktop.auth.getSession).mockReturnValue(
      new Promise((r) => { resolve = r; }),
    );

    render(<Wrapper />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
    resolve!(null);
  });

  it('redirects to /auth/login when no session', async () => {
    vi.mocked(window.desktop.auth.getSession).mockResolvedValue(null);

    render(<Wrapper />);

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeTruthy();
    });
  });

  it('renders outlet when session exists', async () => {
    vi.mocked(window.desktop.auth.getSession).mockResolvedValue(mockSession);

    render(<Wrapper />);

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeTruthy();
    });
  });
});
