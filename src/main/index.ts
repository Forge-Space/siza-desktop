import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { CHANNELS } from '../shared/bridge';
import { registerAuthHandlers } from './ipc/auth';
import { registerOllamaHandlers } from './ipc/ollama';

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js')
    }
  });

  win.loadFile(join(__dirname, '../renderer/index.html'));
  return win;
}

app.whenReady().then(() => {
  ipcMain.handle(CHANNELS.ping, () => 'pong');
  registerAuthHandlers();
  registerOllamaHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
