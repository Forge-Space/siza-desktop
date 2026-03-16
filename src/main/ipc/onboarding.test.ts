import { describe, it, expect, vi, beforeEach } from 'vitest';

const handlers = new Map<string, (...args: unknown[]) => unknown>();

const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();
const mockSetBaseUrl = vi.fn();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    }
  },
  app: {
    getPath: () => '/tmp/test-userdata'
  }
}));

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir
}));

vi.mock('./ollama', () => ({
  setBaseUrl: mockSetBaseUrl
}));

describe('registerOnboardingHandlers', () => {
  beforeEach(async () => {
    handlers.clear();
    mockReadFile.mockReset();
    mockWriteFile.mockReset();
    mockMkdir.mockReset();
    mockSetBaseUrl.mockReset();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    vi.resetModules();
    const mod = await import('./onboarding');
    mod.registerOnboardingHandlers();
  });

  it('registers all onboarding channels', () => {
    expect(handlers.has('onboarding:get-state')).toBe(true);
    expect(handlers.has('onboarding:complete')).toBe(true);
    expect(handlers.has('onboarding:reset')).toBe(true);
  });

  it('get-state returns { completed: false } when file does not exist', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    const state = await handlers.get('onboarding:get-state')!(null) as { completed: boolean };
    expect(state.completed).toBe(false);
  });

  it('get-state returns parsed state from file', async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ completed: true, ollamaUrl: 'http://localhost:11434' })
    );

    const state = await handlers.get('onboarding:get-state')!(null) as { completed: boolean; ollamaUrl?: string };
    expect(state.completed).toBe(true);
    expect(state.ollamaUrl).toBe('http://localhost:11434');
  });

  it('complete writes completed state with ollamaUrl', async () => {
    await handlers.get('onboarding:complete')!(null, 'http://localhost:11434');

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({ completed: true, ollamaUrl: 'http://localhost:11434' }),
      'utf-8'
    );
  });

  it('complete calls setBaseUrl when ollamaUrl provided', async () => {
    await handlers.get('onboarding:complete')!(null, 'http://custom:11434');
    expect(mockSetBaseUrl).toHaveBeenCalledWith('http://custom:11434');
  });

  it('complete does not call setBaseUrl when ollamaUrl is empty', async () => {
    await handlers.get('onboarding:complete')!(null, '');
    expect(mockSetBaseUrl).not.toHaveBeenCalled();
  });

  it('reset writes completed: false state', async () => {
    await handlers.get('onboarding:reset')!(null);

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({ completed: false }),
      'utf-8'
    );
  });

  it('complete creates userData directory before writing', async () => {
    await handlers.get('onboarding:complete')!(null, 'http://localhost:11434');
    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining('test-userdata'),
      { recursive: true }
    );
  });

  it('get-state returns { completed: false } for malformed JSON', async () => {
    mockReadFile.mockResolvedValue('not valid json{{{{');

    const state = await handlers.get('onboarding:get-state')!(null) as { completed: boolean };
    expect(state.completed).toBe(false);
  });
});
