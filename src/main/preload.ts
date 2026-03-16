import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge, OllamaPullProgress } from '../shared/bridge';
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
    getBaseUrl: () => ipcRenderer.invoke(CHANNELS.ollamaGetBaseUrl),
    getModels: () => ipcRenderer.invoke(CHANNELS.ollamaGetModels),
    pullModel: (name, onProgress) => {
      const listener = (_e: Electron.IpcRendererEvent, p: OllamaPullProgress) => onProgress(p);
      ipcRenderer.on(CHANNELS.ollamaPullProgress, listener);
      return ipcRenderer.invoke(CHANNELS.ollamaPullModel, name).finally(() => {
        ipcRenderer.removeListener(CHANNELS.ollamaPullProgress, listener);
      });
    },
    deleteModel: (name) => ipcRenderer.invoke(CHANNELS.ollamaDeleteModel, name)
  },
  generate: {
    component: (req) => ipcRenderer.invoke(CHANNELS.generateComponent, req)
  },
  updater: {
    check: () => ipcRenderer.invoke(CHANNELS.updaterCheck),
    download: () => ipcRenderer.invoke(CHANNELS.updaterDownload),
    install: () => ipcRenderer.invoke(CHANNELS.updaterInstall),
    status: () => ipcRenderer.invoke(CHANNELS.updaterStatus)
  },
  files: {
    saveGenerated: (req) => ipcRenderer.invoke(CHANNELS.filesSaveGenerated, req)
  },
  onboarding: {
    getState: () => ipcRenderer.invoke(CHANNELS.onboardingGetState),
    complete: (ollamaUrl) => ipcRenderer.invoke(CHANNELS.onboardingComplete, ollamaUrl),
    reset: () => ipcRenderer.invoke(CHANNELS.onboardingReset)
  }
};

contextBridge.exposeInMainWorld('desktop', desktopBridge);
