import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CHANNELS } from '../../shared/bridge';

const handlers = new Map<string, (...args: unknown[]) => unknown>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    }
  }
}));

const { registerOllamaHandlers } = await import('./ollama');

describe('registerOllamaHandlers', () => {
  beforeEach(() => {
    handlers.clear();
    registerOllamaHandlers();
  });

  it('getBaseUrl returns default URL', () => {
    const handler = handlers.get(CHANNELS.ollamaGetBaseUrl)!;
    expect(handler(null)).toBe('http://localhost:11434');
  });

  it('setBaseUrl + getBaseUrl roundtrip', () => {
    handlers.get(CHANNELS.ollamaSetBaseUrl)!(null, 'http://localhost:11435/');
    expect(handlers.get(CHANNELS.ollamaGetBaseUrl)!(null)).toBe('http://localhost:11435');
  });

  it('setBaseUrl strips trailing slash', () => {
    handlers.get(CHANNELS.ollamaSetBaseUrl)!(null, 'http://example.com/');
    expect(handlers.get(CHANNELS.ollamaGetBaseUrl)!(null)).toBe('http://example.com');
  });

  it('getStatus returns healthy on 200 with models', async () => {
    const mockModels = [{ name: 'llama3', size: 1000, digest: 'abc123' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels })
    } as Response);

    const result = await (handlers.get(CHANNELS.ollamaGetStatus)!(null) as Promise<unknown>);
    expect(result).toEqual({ healthy: true, models: mockModels, error: null });
  });

  it('getStatus returns unhealthy on non-200', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 } as Response);

    const result = await (handlers.get(CHANNELS.ollamaGetStatus)!(null) as Promise<unknown>);
    expect(result).toMatchObject({ healthy: false, error: 'HTTP 503' });
  });

  it('getStatus returns unhealthy on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await (handlers.get(CHANNELS.ollamaGetStatus)!(null) as Promise<unknown>);
    expect(result).toMatchObject({ healthy: false, error: 'ECONNREFUSED' });
  });

  it('getStatus handles missing models array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    } as Response);

    const result = await (handlers.get(CHANNELS.ollamaGetStatus)!(null) as Promise<{ models: unknown[] }>);
    expect(result).toMatchObject({ healthy: true, models: [] });
  });
});
