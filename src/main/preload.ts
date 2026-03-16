import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge } from '../shared/bridge';
import { CHANNELS } from '../shared/bridge';

const desktopBridge: DesktopBridge = {
  ping: () => ipcRenderer.invoke(CHANNELS.ping),
  auth: {
    signIn: (email, password) => ipcRenderer.invoke(CHANNELS.authSignIn, email, password),
    signOut: () => ipcRenderer.invoke(CHANNELS.authSignOut),
    getSession: () => ipcRenderer.invoke(CHANNELS.authGetSession)
  },
  ollama: {
    getStatus: () => ipcRenderer.invoke(CHANNELS.ollamaGetStatus),
    setBaseUrl: (url) => ipcRenderer.invoke(CHANNELS.ollamaSetBaseUrl, url),
    getBaseUrl: () => ipcRenderer.invoke(CHANNELS.ollamaGetBaseUrl)
  },
  generate: {
    component: (req) => ipcRenderer.invoke(CHANNELS.generateComponent, req)
  }
};

contextBridge.exposeInMainWorld('desktop', desktopBridge);
