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
}

export const CHANNELS = {
  ping: 'app:ping',
  authSignIn: 'auth:sign-in',
  authSignOut: 'auth:sign-out',
  authGetSession: 'auth:get-session',
  ollamaGetStatus: 'ollama:get-status',
  ollamaSetBaseUrl: 'ollama:set-base-url',
  ollamaGetBaseUrl: 'ollama:get-base-url',
  generateComponent: 'generate:component'
} as const;

export function normalizePing(value: unknown): string {
  return typeof value === 'string' ? value : 'unknown';
}
