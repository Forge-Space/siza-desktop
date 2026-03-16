import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

const mockSession = { email: 'test@example.com', accessToken: 'tok', refreshToken: 'ref', userId: 'u1' };

function TestConsumer() {
  const { session, loading, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="email">{session?.email ?? 'none'}</span>
      <button onClick={() => signIn('a@b.com', 'pw')}>sign-in</button>
      <button onClick={() => signOut()}>sign-out</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts loading and resolves session', async () => {
    vi.mocked(window.desktop.auth.getSession).mockResolvedValue(mockSession);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading').textContent).toBe('loading');

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready');
    });
    expect(screen.getByTestId('email').textContent).toBe('test@example.com');
  });

  it('resolves to null session when no session exists', async () => {
    vi.mocked(window.desktop.auth.getSession).mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready');
    });
    expect(screen.getByTestId('email').textContent).toBe('none');
  });

  it('signIn sets session on success', async () => {
    vi.mocked(window.desktop.auth.getSession).mockResolvedValue(null);
    vi.mocked(window.desktop.auth.signIn).mockResolvedValue({ session: mockSession, error: null });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => screen.getByTestId('loading').textContent === 'ready');

    await act(async () => {
      await userEvent.click(screen.getByText('sign-in'));
    });

    expect(screen.getByTestId('email').textContent).toBe('test@example.com');
  });

  it('signIn returns error string on failure', async () => {
    vi.mocked(window.desktop.auth.getSession).mockResolvedValue(null);
    vi.mocked(window.desktop.auth.signIn).mockResolvedValue({ session: null, error: 'Invalid credentials' });

    let errorResult: string | null = null;

    function ErrorConsumer() {
      const { signIn } = useAuth();
      return (
        <button
          onClick={async () => {
            errorResult = await signIn('a@b.com', 'wrong');
          }}
        >
          sign-in
        </button>
      );
    }

    render(
      <AuthProvider>
        <ErrorConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await userEvent.click(screen.getByText('sign-in'));
    });

    expect(errorResult).toBe('Invalid credentials');
  });

  it('signOut clears session', async () => {
    vi.mocked(window.desktop.auth.getSession).mockResolvedValue(mockSession);
    vi.mocked(window.desktop.auth.signOut).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => screen.getByTestId('email').textContent === 'test@example.com');

    await act(async () => {
      await userEvent.click(screen.getByText('sign-out'));
    });

    expect(screen.getByTestId('email').textContent).toBe('none');
  });

  it('useAuth throws outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });
});
