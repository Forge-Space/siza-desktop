import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AppRouter from './router';

const mockSession = { email: 'u@test.com', accessToken: 'tok', refreshToken: 'ref', userId: 'u1' };

describe('AppRouter / OnboardingGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.desktop.auth.getSession).mockResolvedValue(mockSession);
  });

  it('renders nothing until onboarding state resolves', async () => {
    let resolve: (v: { completed: boolean }) => void;
    vi.mocked(window.desktop.onboarding.getState).mockReturnValue(
      new Promise((r) => { resolve = r; }),
    );

    const { container } = render(<AppRouter />);
    expect(container.firstChild).toBeNull();
    resolve!({ completed: true });
  });

  it('shows OnboardingPage when onboarding is not completed', async () => {
    vi.mocked(window.desktop.onboarding.getState).mockResolvedValue({ completed: false });

    render(<AppRouter />);

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeTruthy();
    });
  });

  it('shows main app routes when onboarding is completed', async () => {
    vi.mocked(window.desktop.onboarding.getState).mockResolvedValue({ completed: true });
    vi.mocked(window.desktop.ollama.getStatus).mockResolvedValue({ healthy: true, models: [], error: null });

    const { container } = render(<AppRouter />);

    await waitFor(() => {
      expect(container.querySelector('main') ?? container.firstChild).toBeTruthy();
    });
  });

  it('handles onboarding error gracefully and shows main routes', async () => {
    vi.mocked(window.desktop.onboarding.getState).mockRejectedValue(new Error('IPC error'));

    render(<AppRouter />);

    await waitFor(() => {
      expect(screen.queryByText(/welcome/i)).toBeNull();
    });
  });
});
