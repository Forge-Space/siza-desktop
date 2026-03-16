import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CHANNELS } from '../../shared/bridge';

const handlers = new Map<string, (...args: unknown[]) => unknown>();

const mockSend = vi.fn();
const mockGetAllWindows = vi.fn(() => [{ webContents: { send: mockSend } }]);

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    }
  },
  BrowserWindow: {
    getAllWindows: mockGetAllWindows
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

  it('getModels returns model list on success', async () => {
    const mockModels = [{ name: 'llama3', size: 2000, digest: 'def456' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels })
    } as Response);

    const result = await (handlers.get(CHANNELS.ollamaGetModels)!(null) as Promise<unknown[]>);
    expect(result).toEqual(mockModels);
  });

  it('getModels returns empty array on non-200', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 } as Response);
    const result = await (handlers.get(CHANNELS.ollamaGetModels)!(null) as Promise<unknown[]>);
    expect(result).toEqual([]);
  });

  it('getModels returns empty array on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await (handlers.get(CHANNELS.ollamaGetModels)!(null) as Promise<unknown[]>);
    expect(result).toEqual([]);
  });

  it('pullModel streams progress and returns done on success', async () => {
    const lines = [
      JSON.stringify({ status: 'pulling', digest: 'sha256:abc', total: 100, completed: 50 }),
      JSON.stringify({ status: 'success' })
    ].join('\n');
    const encoder = new TextEncoder();
    const encoded = encoder.encode(lines);
    let pos = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (pos === 0) { pos++; return { done: false, value: encoded }; }
        return { done: true, value: undefined };
      })
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader }
    } as unknown as Response);

    const result = await (handlers.get(CHANNELS.ollamaPullModel)!(null, 'llama3') as Promise<{ done: boolean; status: string }>);
    expect(result.done).toBe(true);
    expect(result.status).toBe('success');
    expect(mockSend).toHaveBeenCalledWith(CHANNELS.ollamaPullProgress, expect.objectContaining({ status: 'success', done: true }));
  });

  it('pullModel returns error on non-200', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, body: null } as unknown as Response);
    const result = await (handlers.get(CHANNELS.ollamaPullModel)!(null, 'badmodel') as Promise<{ done: boolean; error?: string }>);
    expect(result.done).toBe(true);
    expect(result.error).toContain('404');
  });

  it('pullModel returns error on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('timeout'));
    const result = await (handlers.get(CHANNELS.ollamaPullModel)!(null, 'badmodel') as Promise<{ done: boolean; error?: string }>);
    expect(result.done).toBe(true);
    expect(result.error).toBe('timeout');
  });

  it('deleteModel returns success on 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    const result = await (handlers.get(CHANNELS.ollamaDeleteModel)!(null, 'llama3') as Promise<{ success: boolean; error: string | null }>);
    expect(result).toEqual({ success: true, error: null });
  });

  it('deleteModel returns error on non-200', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response);
    const result = await (handlers.get(CHANNELS.ollamaDeleteModel)!(null, 'nosuchmodel') as Promise<{ success: boolean; error: string | null }>);
    expect(result).toEqual({ success: false, error: 'HTTP 404' });
  });

  it('deleteModel returns error on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await (handlers.get(CHANNELS.ollamaDeleteModel)!(null, 'llama3') as Promise<{ success: boolean; error: string | null }>);
    expect(result).toEqual({ success: false, error: 'ECONNREFUSED' });
  });

  it('getStatus returns Connection failed for non-Error throw', async () => {
    global.fetch = vi.fn().mockRejectedValue('string error');
    const result = await (handlers.get(CHANNELS.ollamaGetStatus)!(null) as Promise<{ healthy: boolean; error: string }>);
    expect(result.healthy).toBe(false);
    expect(result.error).toBe('Connection failed');
  });

  it('getModels returns empty array when models is null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: null })
    } as unknown as Response);
    const result = await (handlers.get(CHANNELS.ollamaGetModels)!(null) as Promise<Array<unknown>>);
    expect(result).toEqual([]);
  });

  it('pullModel skips empty lines and malformed JSON in chunk', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('\n  \n{"status":"success"}\n{bad json}\n')
        })
        .mockResolvedValueOnce({ done: true, value: undefined })
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader }
    } as unknown as Response);
    const result = await (handlers.get(CHANNELS.ollamaPullModel)!(null, 'llama3') as Promise<{ done: boolean; status: string }>);
    expect(result.done).toBe(true);
    expect(result.status).toBe('success');
  });

  it('deleteModel returns Delete failed for non-Error throw', async () => {
    global.fetch = vi.fn().mockRejectedValue('string error');
    const result = await (handlers.get(CHANNELS.ollamaDeleteModel)!(null, 'llama3') as Promise<{ success: boolean; error: string | null }>);
    expect(result).toEqual({ success: false, error: 'Delete failed' });
  });
});
