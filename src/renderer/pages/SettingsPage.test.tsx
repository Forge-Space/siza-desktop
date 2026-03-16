import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';

const mockSignOut = vi.fn();
let mockSession: { email: string } | null = null;

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    session: mockSession,
    signOut: mockSignOut,
  }),
}));

const mockDesktop = (window as unknown as { desktop: typeof window.desktop }).desktop;

beforeEach(() => {
  mockSession = null;
  vi.clearAllMocks();
  (mockDesktop.ollama.getBaseUrl as ReturnType<typeof vi.fn>).mockResolvedValue('http://localhost:11434');
  (mockDesktop.ollama.setBaseUrl as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  mockSignOut.mockResolvedValue(undefined);
});

describe('SettingsPage', () => {
  it('renders heading and Ollama URL input', async () => {
    render(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByDisplayValue('http://localhost:11434')).toBeInTheDocument();
    });
  });

  it('loads current Ollama URL on mount', async () => {
    (mockDesktop.ollama.getBaseUrl as ReturnType<typeof vi.fn>).mockResolvedValue('http://custom:11434');
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('http://custom:11434')).toBeInTheDocument();
    });
    expect(mockDesktop.ollama.getBaseUrl).toHaveBeenCalledOnce();
  });

  it('saves Ollama URL on form submit', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await waitFor(() => screen.getByDisplayValue('http://localhost:11434'));

    const input = screen.getByDisplayValue('http://localhost:11434');
    await user.clear(input);
    await user.type(input, 'http://newhost:11434');

    const saveBtn = screen.getByRole('button', { name: /save/i });
    await user.click(saveBtn);

    expect(mockDesktop.ollama.setBaseUrl).toHaveBeenCalledWith('http://newhost:11434');
  });

  it('shows "Saved!" feedback immediately after save', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await waitFor(() => screen.getByDisplayValue('http://localhost:11434'));

    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('resets "Saved!" back to "Save" after 2 seconds', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await waitFor(() => screen.getByDisplayValue('http://localhost:11434'));

    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    // Wait for the 2s timeout to fire and reset the label
    await waitFor(() => expect(screen.queryByText('Saved!')).not.toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows email when session is set', () => {
    mockSession = { email: 'test@example.com' };
    render(<SettingsPage />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('does not show email when no session', () => {
    mockSession = null;
    render(<SettingsPage />);
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it('calls signOut when sign out button clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByRole('button', { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('disables sign out button while signing out', async () => {
    const user = userEvent.setup();
    let resolveSignOut!: () => void;
    mockSignOut.mockReturnValue(new Promise<void>(res => { resolveSignOut = res; }));

    render(<SettingsPage />);

    const btn = screen.getByRole('button', { name: /sign out/i });
    await user.click(btn);
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Signing out…');
    resolveSignOut();
  });

  it('saved status message has role="status"', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await waitFor(() => screen.getByDisplayValue('http://localhost:11434'));

    await user.click(screen.getByRole('button', { name: /save/i }));

    const statusMsg = document.querySelector('[role="status"]');
    expect(statusMsg).toBeInTheDocument();
  });

  it('sign-out button has aria-busy when signing out', async () => {
    const user = userEvent.setup();
    let resolveSignOut!: () => void;
    mockSignOut.mockReturnValue(new Promise<void>(res => { resolveSignOut = res; }));

    render(<SettingsPage />);

    const btn = screen.getByRole('button', { name: /sign out/i });
    await user.click(btn);

    expect(btn).toHaveAttribute('aria-busy', 'true');
    resolveSignOut();
  });
});
