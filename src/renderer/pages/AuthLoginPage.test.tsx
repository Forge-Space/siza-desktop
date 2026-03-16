import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import AuthLoginPage from './AuthLoginPage';

const mockSignIn = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

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
      <AuthLoginPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockSignIn.mockReset();
  mockNavigate.mockReset();
});

describe('AuthLoginPage', () => {
  it('renders email and password fields', () => {
    renderPage();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('calls signIn with email and password on submit', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(null);
    renderPage();

    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows error message on signIn failure', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue('Invalid login credentials');
    renderPage();

    await user.type(screen.getByLabelText(/Email/i), 'bad@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
  });

  it('navigates to /generate on success', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(null);
    renderPage();

    await user.type(screen.getByLabelText(/Email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/generate', { replace: true });
    });
  });

  it('disables inputs while loading', async () => {
    const user = userEvent.setup();
    // Keep signIn pending so loading stays true
    let resolve: (v: string | null) => void;
    mockSignIn.mockReturnValue(new Promise(r => { resolve = r; }));

    renderPage();

    await user.type(screen.getByLabelText(/Email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Email/i)).toBeDisabled();
      expect(screen.getByLabelText(/Password/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /Signing in/i })).toBeDisabled();
    });

    resolve!(null);
  });

  it('does not navigate when signIn returns an error', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue('Something went wrong');
    renderPage();

    await user.type(screen.getByLabelText(/Email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
