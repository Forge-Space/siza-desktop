import { ipcMain } from 'electron';
import type { OllamaStatus } from '../../shared/bridge';
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
}
