import { ipcMain, BrowserWindow } from 'electron';
import type { OllamaStatus, OllamaPullProgress, OllamaDeleteResult } from '../../shared/bridge';
import { CHANNELS } from '../../shared/bridge';

let ollamaBaseUrl = 'http://localhost:11434';

export function getBaseUrl(): string {
  return ollamaBaseUrl;
}

export function setBaseUrl(url: string): void {
  ollamaBaseUrl = url.replace(/\/$/, '');
}

export function registerOllamaHandlers(): void {
  ipcMain.handle(CHANNELS.ollamaGetBaseUrl, (): string => ollamaBaseUrl);

  ipcMain.handle(CHANNELS.ollamaSetBaseUrl, (_event, url: string): void => {
    setBaseUrl(url);
  });

  ipcMain.handle(CHANNELS.ollamaGetStatus, async (): Promise<OllamaStatus> => {
    try {
      const res = await fetch(`${ollamaBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) {
        return { healthy: false, models: [], error: `HTTP ${res.status}` };
      }
      const data = await res.json() as { models?: Array<{ name: string; size: number; digest: string }> };
      return {
        healthy: true,
        models: (data.models ?? []).map(m => ({ name: m.name, size: m.size, digest: m.digest })),
        error: null
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      return { healthy: false, models: [], error: message };
    }
  });

  ipcMain.handle(CHANNELS.ollamaGetModels, async (): Promise<Array<{ name: string; size: number; digest: string }>> => {
    try {
      const res = await fetch(`${ollamaBaseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const data = await res.json() as { models?: Array<{ name: string; size: number; digest: string }> };
      return (data.models ?? []).map(m => ({ name: m.name, size: m.size, digest: m.digest }));
    } catch {
      return [];
    }
  });

  ipcMain.handle(CHANNELS.ollamaPullModel, async (_event, name: string): Promise<OllamaPullProgress> => {
    const win = BrowserWindow.getAllWindows()[0];
    try {
      const res = await fetch(`${ollamaBaseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, stream: true }),
        signal: AbortSignal.timeout(600000)
      });
      if (!res.ok || !res.body) {
        const err = `HTTP ${res.status}`;
        return { status: 'error', done: true, error: err };
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let lastProgress: OllamaPullProgress = { status: 'pulling', done: false };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line) as { status?: string; digest?: string; total?: number; completed?: number };
            const isDone = parsed.status === 'success';
            lastProgress = {
              status: parsed.status ?? 'pulling',
              digest: parsed.digest,
              total: parsed.total,
              completed: parsed.completed,
              done: isDone
            };
            win?.webContents.send(CHANNELS.ollamaPullProgress, lastProgress);
          } catch {
            // skip malformed line
          }
        }
      }
      return { ...lastProgress, done: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pull failed';
      const progress: OllamaPullProgress = { status: 'error', done: true, error: message };
      win?.webContents.send(CHANNELS.ollamaPullProgress, progress);
      return progress;
    }
  });

  ipcMain.handle(CHANNELS.ollamaDeleteModel, async (_event, name: string): Promise<OllamaDeleteResult> => {
    try {
      const res = await fetch(`${ollamaBaseUrl}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` };
      }
      return { success: true, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      return { success: false, error: message };
    }
  });
}
