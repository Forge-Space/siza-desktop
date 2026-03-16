import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UpdateBanner from './UpdateBanner';

beforeEach(() => {
  vi.mocked(window.desktop.updater.status).mockResolvedValue({ state: 'idle' });
  vi.mocked(window.desktop.updater.download).mockResolvedValue({ state: 'downloading' });
  vi.mocked(window.desktop.updater.install).mockResolvedValue(undefined);
});

describe('UpdateBanner', () => {
  it('renders nothing when state is idle', async () => {
    vi.mocked(window.desktop.updater.status).mockResolvedValue({ state: 'idle' });
    const { container } = render(<UpdateBanner />);
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('renders nothing when state is not-available', async () => {
    vi.mocked(window.desktop.updater.status).mockResolvedValue({ state: 'not-available' });
    const { container } = render(<UpdateBanner />);
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('renders download button when state is available with version', async () => {
    vi.mocked(window.desktop.updater.status).mockResolvedValue({
      state: 'available',
      version: '1.2.3',
    });
    render(<UpdateBanner />);

    await waitFor(() => {
      expect(screen.getByText(/Update v1\.2\.3 available/)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
  });

  it('renders downloading progress when state is downloading with percent', async () => {
    vi.mocked(window.desktop.updater.status).mockResolvedValue({
      state: 'downloading',
      percent: 42,
    });
    render(<UpdateBanner />);

    await waitFor(() => {
      expect(screen.getByText(/Downloading update.*42%/)).toBeInTheDocument();
    });
  });

  it('renders restart button when state is ready', async () => {
    vi.mocked(window.desktop.updater.status).mockResolvedValue({
      state: 'ready',
      version: '1.2.3',
    });
    render(<UpdateBanner />);

    await waitFor(() => {
      expect(screen.getByText(/Update v1\.2\.3 ready to install/)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Restart & install/i })).toBeInTheDocument();
  });

  it('dismiss button hides the banner', async () => {
    const user = userEvent.setup();
    vi.mocked(window.desktop.updater.status).mockResolvedValue({
      state: 'available',
      version: '2.0.0',
    });
    const { container } = render(<UpdateBanner />);

    await waitFor(() => {
      expect(screen.getByText(/Update v2\.0\.0 available/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Dismiss/i }));

    expect(container).toBeEmptyDOMElement();
  });

  it('clicking download button calls window.desktop.updater.download', async () => {
    const user = userEvent.setup();
    vi.mocked(window.desktop.updater.status).mockResolvedValue({
      state: 'available',
      version: '1.0.0',
    });
    vi.mocked(window.desktop.updater.download).mockResolvedValue({ state: 'downloading', percent: 0 });

    render(<UpdateBanner />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Download/i }));

    expect(window.desktop.updater.download).toHaveBeenCalledTimes(1);
  });

  it('clicking restart button calls window.desktop.updater.install', async () => {
    const user = userEvent.setup();
    vi.mocked(window.desktop.updater.status).mockResolvedValue({
      state: 'ready',
      version: '1.0.0',
    });

    render(<UpdateBanner />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Restart & install/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Restart & install/i }));

    expect(window.desktop.updater.install).toHaveBeenCalledTimes(1);
  });

  it('shows 0% when downloading without percent', async () => {
    vi.mocked(window.desktop.updater.status).mockResolvedValue({
      state: 'downloading',
    });
    render(<UpdateBanner />);

    await waitFor(() => {
      expect(screen.getByText(/Downloading update.*0%/)).toBeInTheDocument();
    });
  });
});
