export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

export interface SignInResult {
  session: AuthSession | null;
  error: string | null;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
}

export interface OllamaStatus {
  healthy: boolean;
  models: OllamaModel[];
  error: string | null;
}

export interface GeneratedFile {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export interface GenerateComponentRequest {
  framework: string;
  componentType: string;
  props?: Record<string, unknown>;
  componentLibrary?: string;
  useLlm?: boolean;
  model?: string;
}

export interface GenerateComponentResult {
  files: GeneratedFile[];
  error: string | null;
  llmUsed?: boolean;
  model?: string;
}

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'ready' | 'error';
  version?: string;
  percent?: number;
  error?: string;
}

export interface SaveFilesRequest {
  files: Array<{ path: string; content: string }>;
  defaultDir?: string;
}

export interface SaveFilesResult {
  savedTo: string | null;
  error: string | null;
}

export interface OnboardingState {
  completed: boolean;
  ollamaUrl?: string;
}

export interface DesktopBridge {
  ping: () => Promise<string>;
  auth: {
    signIn: (email: string, password: string) => Promise<SignInResult>;
    signOut: () => Promise<void>;
    getSession: () => Promise<AuthSession | null>;
  };
  ollama: {
    getStatus: () => Promise<OllamaStatus>;
    setBaseUrl: (url: string) => Promise<void>;
    getBaseUrl: () => Promise<string>;
  };
  generate: {
    component: (req: GenerateComponentRequest) => Promise<GenerateComponentResult>;
  };
  updater: {
    check: () => Promise<UpdateStatus>;
    download: () => Promise<UpdateStatus>;
    install: () => Promise<void>;
    status: () => Promise<UpdateStatus>;
  };
  files: {
    saveGenerated: (req: SaveFilesRequest) => Promise<SaveFilesResult>;
  };
  onboarding: {
    getState: () => Promise<OnboardingState>;
    complete: (ollamaUrl: string) => Promise<void>;
    reset: () => Promise<void>;
  };
}

export const CHANNELS = {
  ping: 'app:ping',
  authSignIn: 'auth:sign-in',
  authSignOut: 'auth:sign-out',
  authGetSession: 'auth:get-session',
  ollamaGetStatus: 'ollama:get-status',
  ollamaSetBaseUrl: 'ollama:set-base-url',
  ollamaGetBaseUrl: 'ollama:get-base-url',
  generateComponent: 'generate:component',
  updaterCheck: 'updater:check',
  updaterDownload: 'updater:download',
  updaterInstall: 'updater:install',
  updaterStatus: 'updater:status',
  filesSaveGenerated: 'files:save-generated',
  onboardingGetState: 'onboarding:get-state',
  onboardingComplete: 'onboarding:complete',
  onboardingReset: 'onboarding:reset'
} as const;

export function normalizePing(value: unknown): string {
  return typeof value === 'string' ? value : 'unknown';
}
