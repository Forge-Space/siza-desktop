import { describe, it, expect, vi, beforeEach } from 'vitest';

const handlers = new Map<string, (...args: unknown[]) => unknown>();
const eventListeners = new Map<string, (...args: unknown[]) => void>();

const mockCheckForUpdates = vi.fn();
const mockDownloadUpdate = vi.fn();
const mockQuitAndInstall = vi.fn();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    }
  }
}));

vi.mock('electron-updater', () => ({
  autoUpdater: {
    autoDownload: false,
    autoInstallOnAppQuit: false,
    on: (event: string, listener: (...args: unknown[]) => void) => {
      eventListeners.set(event, listener);
    },
    checkForUpdates: mockCheckForUpdates,
    downloadUpdate: mockDownloadUpdate,
    quitAndInstall: mockQuitAndInstall
  }
}));

describe('registerUpdaterHandlers', () => {
  beforeEach(async () => {
    handlers.clear();
    eventListeners.clear();
    mockCheckForUpdates.mockReset();
    mockDownloadUpdate.mockReset();
    mockQuitAndInstall.mockReset();

    vi.resetModules();
    const mod = await import('./updater');
    mod.registerUpdaterHandlers();
  });

  it('registers all updater channels', () => {
    expect(handlers.has('updater:check')).toBe(true);
    expect(handlers.has('updater:download')).toBe(true);
    expect(handlers.has('updater:install')).toBe(true);
    expect(handlers.has('updater:status')).toBe(true);
  });

  it('status returns idle initially', async () => {
    const status = await handlers.get('updater:status')!(null);
    expect(status).toEqual({ state: 'idle' });
  });

  it('check calls autoUpdater.checkForUpdates and returns status', async () => {
    mockCheckForUpdates.mockResolvedValue(undefined);
    const status = await handlers.get('updater:check')!(null);
    expect(mockCheckForUpdates).toHaveBeenCalled();
    expect(status).toBeDefined();
  });

  it('check returns error status on throw', async () => {
    mockCheckForUpdates.mockRejectedValue(new Error('Network error'));
    const status = await handlers.get('updater:check')!(null) as { state: string; error?: string };
    expect(status.state).toBe('error');
    expect(status.error).toBe('Failed to check for updates');
  });

  it('download calls autoUpdater.downloadUpdate', async () => {
    mockDownloadUpdate.mockResolvedValue(undefined);
    await handlers.get('updater:download')!(null);
    expect(mockDownloadUpdate).toHaveBeenCalled();
  });

  it('download returns error status on throw', async () => {
    mockDownloadUpdate.mockRejectedValue(new Error('Download failed'));
    const status = await handlers.get('updater:download')!(null) as { state: string; error?: string };
    expect(status.state).toBe('error');
    expect(status.error).toBe('Download failed');
  });

  it('install calls quitAndInstall', () => {
    handlers.get('updater:install')!(null);
    expect(mockQuitAndInstall).toHaveBeenCalled();
  });

  it('checking-for-update event sets checking state', async () => {
    eventListeners.get('checking-for-update')?.();
    const status = await handlers.get('updater:status')!(null) as { state: string };
    expect(status.state).toBe('checking');
  });

  it('update-available event sets available state with version', async () => {
    eventListeners.get('update-available')?.({ version: '1.2.3' });
    const status = await handlers.get('updater:status')!(null) as { state: string; version?: string };
    expect(status.state).toBe('available');
    expect(status.version).toBe('1.2.3');
  });

  it('update-not-available event sets not-available state', async () => {
    eventListeners.get('update-not-available')?.();
    const status = await handlers.get('updater:status')!(null) as { state: string };
    expect(status.state).toBe('not-available');
  });

  it('download-progress event sets downloading state with percent', async () => {
    eventListeners.get('download-progress')?.({ percent: 45.7 });
    const status = await handlers.get('updater:status')!(null) as { state: string; percent?: number };
    expect(status.state).toBe('downloading');
    expect(status.percent).toBe(46);
  });

  it('update-downloaded event sets ready state with version', async () => {
    eventListeners.get('update-downloaded')?.({ version: '1.2.3' });
    const status = await handlers.get('updater:status')!(null) as { state: string; version?: string };
    expect(status.state).toBe('ready');
    expect(status.version).toBe('1.2.3');
  });

  it('error event sets error state with message', async () => {
    eventListeners.get('error')?.(new Error('Something went wrong'));
    const status = await handlers.get('updater:status')!(null) as { state: string; error?: string };
    expect(status.state).toBe('error');
    expect(status.error).toBe('Something went wrong');
  });
});
