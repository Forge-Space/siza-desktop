import '@testing-library/jest-dom';

const mockDesktop = {
  auth: {
    signIn: vi.fn().mockResolvedValue({ session: null, error: null }),
    signOut: vi.fn().mockResolvedValue(undefined),
    getSession: vi.fn().mockResolvedValue(null),
  },
  ollama: {
    getStatus: vi.fn().mockResolvedValue({ healthy: false, models: [], error: null }),
    setBaseUrl: vi.fn().mockResolvedValue(undefined),
    getBaseUrl: vi.fn().mockResolvedValue('http://localhost:11434'),
    getModels: vi.fn().mockResolvedValue([]),
    pullModel: vi.fn().mockResolvedValue({ status: 'success', done: true }),
    deleteModel: vi.fn().mockResolvedValue({ success: true, error: null }),
  },
  generate: {
    component: vi.fn().mockResolvedValue({ files: [], error: null }),
  },
  updater: {
    status: vi.fn().mockResolvedValue({ state: 'idle' }),
    check: vi.fn().mockResolvedValue({ state: 'idle' }),
    download: vi.fn().mockResolvedValue({ state: 'downloading' }),
    install: vi.fn().mockResolvedValue(undefined),
  },
  files: {
    saveGenerated: vi.fn().mockResolvedValue({ savedTo: null, error: null }),
  },
  onboarding: {
    getState: vi.fn().mockResolvedValue({ completed: true }),
    complete: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue(undefined),
  },
  ping: vi.fn().mockResolvedValue('pong'),
};

Object.defineProperty(window, 'desktop', { value: mockDesktop, writable: true });
