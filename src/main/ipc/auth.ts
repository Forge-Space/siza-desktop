import { ipcMain, safeStorage, app } from 'electron';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { AuthSession, SignInResult } from '../../shared/bridge';
import { CHANNELS } from '../../shared/bridge';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const SESSION_FILE = 'siza-session.bin';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

let activeSession: AuthSession | null = null;

function toAuthSession(session: {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string };
}): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    userId: session.user.id,
    email: session.user.email ?? ''
  };
}

function sessionPath(): string {
  return join(app.getPath('userData'), SESSION_FILE);
}

function saveSession(session: AuthSession | null): void {
  if (!safeStorage.isEncryptionAvailable()) return;
  const data = session ? JSON.stringify(session) : '';
  const encrypted = safeStorage.encryptString(data);
  mkdirSync(app.getPath('userData'), { recursive: true });
  writeFileSync(sessionPath(), encrypted);
}

function loadSession(): AuthSession | null {
  if (!safeStorage.isEncryptionAvailable()) return null;
  try {
    const encrypted = readFileSync(sessionPath());
    const data = safeStorage.decryptString(Buffer.from(encrypted));
    if (!data) return null;
    return JSON.parse(data) as AuthSession;
  } catch {
    return null;
  }
}

export function registerAuthHandlers(): void {
  activeSession = loadSession();

  ipcMain.handle(CHANNELS.authSignIn, async (_event, email: string, password: string): Promise<SignInResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return { session: null, error: error?.message ?? 'Sign in failed' };
    }
    activeSession = toAuthSession(data.session);
    saveSession(activeSession);
    return { session: activeSession, error: null };
  });

  ipcMain.handle(CHANNELS.authSignOut, async (): Promise<void> => {
    if (activeSession) {
      await supabase.auth.signOut();
    }
    activeSession = null;
    saveSession(null);
  });

  ipcMain.handle(CHANNELS.authGetSession, (): AuthSession | null => {
    return activeSession;
  });
}
