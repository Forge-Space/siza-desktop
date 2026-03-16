import { ipcMain } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'ready' | 'error';
  version?: string;
  percent?: number;
  error?: string;
}

let currentStatus: UpdateStatus = { state: 'idle' };

export function registerUpdaterHandlers(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    currentStatus = { state: 'checking' };
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    currentStatus = { state: 'available', version: info.version };
  });

  autoUpdater.on('update-not-available', () => {
    currentStatus = { state: 'not-available' };
  });

  autoUpdater.on('download-progress', (progress) => {
    currentStatus = { state: 'downloading', percent: Math.round(progress.percent) };
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    currentStatus = { state: 'ready', version: info.version };
  });

  autoUpdater.on('error', (err: Error) => {
    currentStatus = { state: 'error', error: err.message };
  });

  ipcMain.handle('updater:check', async () => {
    try {
      await autoUpdater.checkForUpdates();
    } catch {
      currentStatus = { state: 'error', error: 'Failed to check for updates' };
    }
    return currentStatus;
  });

  ipcMain.handle('updater:download', async () => {
    try {
      await autoUpdater.downloadUpdate();
    } catch (err) {
      currentStatus = { state: 'error', error: err instanceof Error ? err.message : 'Download failed' };
    }
    return currentStatus;
  });

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle('updater:status', () => currentStatus);
}
