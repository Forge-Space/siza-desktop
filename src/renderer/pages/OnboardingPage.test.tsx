import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import OnboardingPage from './OnboardingPage';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <OnboardingPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
  vi.mocked(window.desktop.ollama.setBaseUrl).mockResolvedValue(undefined);
  vi.mocked(window.desktop.ollama.getStatus).mockResolvedValue({ healthy: false, models: [], error: null });
  vi.mocked(window.desktop.onboarding.complete).mockResolvedValue(undefined);
});

describe('OnboardingPage', () => {
  it('renders welcome step initially with "Get started" button', () => {
    renderPage();
    expect(screen.getByText(/Welcome to Siza Desktop/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument();
  });

  it('clicking Get started shows Ollama URL step', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Get started/i }));

    expect(screen.getByText(/Connect Ollama/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Test connection/i })).toBeInTheDocument();
  });

  it('shows checking state while testing connection', async () => {
    const user = userEvent.setup();
    let resolveStatus: (v: { healthy: boolean; models: never[]; error: null }) => void;
    vi.mocked(window.desktop.ollama.getStatus).mockReturnValue(
      new Promise(r => { resolveStatus = r; })
    );

    renderPage();
    await user.click(screen.getByRole('button', { name: /Get started/i }));
    await user.click(screen.getByRole('button', { name: /Test connection/i }));

    // While the promise is pending, button should be disabled (checking state)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Test connection/i })).toBeDisabled();
    });

    resolveStatus!({ healthy: true, models: [], error: null });
  });

  it('shows success state when Ollama is healthy', async () => {
    const user = userEvent.setup();
    vi.mocked(window.desktop.ollama.getStatus).mockResolvedValue({
      healthy: true,
      models: [],
      error: null,
    });

    renderPage();
    await user.click(screen.getByRole('button', { name: /Get started/i }));
    await user.click(screen.getByRole('button', { name: /Test connection/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ollama is reachable/i)).toBeInTheDocument();
    });
  });

  it('shows error state when Ollama is not reachable', async () => {
    const user = userEvent.setup();
    vi.mocked(window.desktop.ollama.getStatus).mockResolvedValue({
      healthy: false,
      models: [],
      error: 'Connection refused',
    });

    renderPage();
    await user.click(screen.getByRole('button', { name: /Get started/i }));
    await user.click(screen.getByRole('button', { name: /Test connection/i }));

    await waitFor(() => {
      expect(screen.getByText('Connection refused')).toBeInTheDocument();
    });
  });

  it('shows generic error when Ollama throws', async () => {
    const user = userEvent.setup();
    vi.mocked(window.desktop.ollama.getStatus).mockRejectedValue(new Error('Network error'));

    renderPage();
    await user.click(screen.getByRole('button', { name: /Get started/i }));
    await user.click(screen.getByRole('button', { name: /Test connection/i }));

    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  it('clicking continue navigates to auth step, then finish calls onboarding.complete and navigates to /auth/login', async () => {
    const user = userEvent.setup();
    vi.mocked(window.desktop.ollama.getStatus).mockResolvedValue({
      healthy: true,
      models: [],
      error: null,
    });

    renderPage();

    // Step 1 → Step 2 (ollama)
    await user.click(screen.getByRole('button', { name: /Get started/i }));

    // Test connection first
    await user.click(screen.getByRole('button', { name: /Test connection/i }));
    await waitFor(() => {
      expect(screen.getByText(/Ollama is reachable/i)).toBeInTheDocument();
    });

    // Continue to auth step
    await user.click(screen.getByRole('button', { name: /Continue/i }));

    // Auth step should show "Sign in" button
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();

    // Click Sign in → finish onboarding
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(window.desktop.onboarding.complete).toHaveBeenCalledWith('http://localhost:11434');
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('changing the URL input updates state and resets status to idle', async () => {
    const user = userEvent.setup();
    vi.mocked(window.desktop.ollama.getStatus).mockResolvedValue({
      healthy: true,
      models: [],
      error: null,
    });

    renderPage();
    await user.click(screen.getByRole('button', { name: /Get started/i }));

    // Test once to set status to something other than idle
    await user.click(screen.getByRole('button', { name: /Test connection/i }));
    await waitFor(() => {
      expect(screen.getByText(/Ollama is reachable/i)).toBeInTheDocument();
    });

    // Now change the URL — this should reset ollamaStatus to 'idle'
    const urlInput = screen.getByRole('textbox');
    await user.clear(urlInput);
    await user.type(urlInput, 'http://localhost:9999');

    // After changing, success message should be gone (status reset to idle)
    expect(screen.queryByText(/Ollama is reachable/i)).not.toBeInTheDocument();
  });

  it('Back button on auth step returns to ollama step', async () => {
    const user = userEvent.setup();
    vi.mocked(window.desktop.ollama.getStatus).mockResolvedValue({
      healthy: true,
      models: [],
      error: null,
    });

    renderPage();

    // Navigate to ollama step
    await user.click(screen.getByRole('button', { name: /Get started/i }));
    // Test connection to enable Continue
    await user.click(screen.getByRole('button', { name: /Test connection/i }));
    await waitFor(() => {
      expect(screen.getByText(/Ollama is reachable/i)).toBeInTheDocument();
    });
    // Navigate to auth step
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();

    // Click Back on auth step → should go back to ollama step
    await user.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByRole('button', { name: /Test connection/i })).toBeInTheDocument();
  });

  it('Back button on ollama step returns to welcome', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Get started/i }));
    expect(screen.getByText(/Connect Ollama/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByText(/Welcome to Siza Desktop/i)).toBeInTheDocument();
  });
});
