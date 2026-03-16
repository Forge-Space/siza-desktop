import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ModelManagerPage } from './ModelManagerPage';
import type { OllamaModel } from '../../shared/bridge';

const mockModels: OllamaModel[] = [
  { name: 'llama3.2', size: 2_000_000_000, digest: 'abc123' },
  { name: 'mistral', size: 4_000_000_000, digest: 'def456' }
];

beforeEach(() => {
  vi.mocked(window.desktop.ollama.getModels).mockResolvedValue(mockModels);
  vi.mocked(window.desktop.ollama.pullModel).mockResolvedValue({ status: 'success', done: true });
  vi.mocked(window.desktop.ollama.deleteModel).mockResolvedValue({ success: true, error: null });
});

describe('ModelManagerPage', () => {
  it('loads and displays installed models', async () => {
    render(<ModelManagerPage />);
    expect(await screen.findByText('llama3.2')).toBeInTheDocument();
    expect(screen.getByText('mistral')).toBeInTheDocument();
  });

  it('shows empty state when no models are installed', async () => {
    vi.mocked(window.desktop.ollama.getModels).mockResolvedValue([]);
    render(<ModelManagerPage />);
    expect(await screen.findByText('No models installed')).toBeInTheDocument();
  });

  it('shows error when getModels fails', async () => {
    vi.mocked(window.desktop.ollama.getModels).mockRejectedValue(new Error('Connection refused'));
    render(<ModelManagerPage />);
    expect(await screen.findByText('Connection refused')).toBeInTheDocument();
  });

  it('shows model sizes formatted', async () => {
    render(<ModelManagerPage />);
    // 2 GB = 2000000000 bytes
    expect(await screen.findByText('1.9 GB')).toBeInTheDocument();
  });

  it('refreshes models when Refresh button is clicked', async () => {
    render(<ModelManagerPage />);
    await screen.findByText('llama3.2');
    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    vi.mocked(window.desktop.ollama.getModels).mockResolvedValue([
      { name: 'newmodel', size: 1000, digest: 'ghi789' }
    ]);
    await act(async () => { fireEvent.click(refreshBtn); });
    expect(await screen.findByText('newmodel')).toBeInTheDocument();
  });

  it('deletes a model when Delete button is clicked', async () => {
    render(<ModelManagerPage />);
    await screen.findByText('llama3.2');
    const deleteBtn = screen.getByRole('button', { name: /delete llama3\.2/i });
    await act(async () => { fireEvent.click(deleteBtn); });
    await waitFor(() => {
      expect(window.desktop.ollama.deleteModel).toHaveBeenCalledWith('llama3.2');
    });
    await waitFor(() => {
      expect(screen.queryByText('llama3.2')).not.toBeInTheDocument();
    });
  });

  it('shows delete error when delete fails', async () => {
    vi.mocked(window.desktop.ollama.deleteModel).mockResolvedValue({ success: false, error: 'Not found' });
    render(<ModelManagerPage />);
    await screen.findByText('llama3.2');
    const deleteBtn = screen.getByRole('button', { name: /delete llama3\.2/i });
    await act(async () => { fireEvent.click(deleteBtn); });
    expect(await screen.findByText('Not found')).toBeInTheDocument();
  });

  it('pulls a model when input is filled and Pull is clicked', async () => {
    render(<ModelManagerPage />);
    await screen.findByText('llama3.2');
    const input = screen.getByPlaceholderText(/e\.g\./i);
    fireEvent.change(input, { target: { value: 'phi4' } });
    const pullBtn = screen.getByRole('button', { name: /^pull$/i });
    await act(async () => { fireEvent.click(pullBtn); });
    await waitFor(() => {
      expect(window.desktop.ollama.pullModel).toHaveBeenCalledWith('phi4', expect.any(Function));
    });
  });

  it('pull button is disabled when input is empty', async () => {
    render(<ModelManagerPage />);
    await screen.findByText('llama3.2');
    const pullBtn = screen.getByRole('button', { name: /^pull$/i });
    expect(pullBtn).toBeDisabled();
  });

  it('shows pull progress bar when pulling', async () => {
    let progressCallback: ((p: { status: string; total: number; completed: number; done: boolean }) => void) | null = null;
    vi.mocked(window.desktop.ollama.pullModel).mockImplementation((_name, onProgress) => {
      progressCallback = onProgress as typeof progressCallback;
      return new Promise(() => {});
    });

    render(<ModelManagerPage />);
    await screen.findByText('llama3.2');
    const input = screen.getByPlaceholderText(/e\.g\./i);
    fireEvent.change(input, { target: { value: 'gemma3' } });
    const pullBtn = screen.getByRole('button', { name: /^pull$/i });
    fireEvent.click(pullBtn);

    await act(async () => {
      progressCallback?.({ status: 'pulling', total: 1000, completed: 500, done: false });
    });

    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
