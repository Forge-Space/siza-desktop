import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge } from '../shared/bridge';
import { CHANNELS } from '../shared/bridge';

const desktopBridge: DesktopBridge = {
  ping: async () => ipcRenderer.invoke(CHANNELS.ping)
};

contextBridge.exposeInMainWorld('desktop', desktopBridge);
