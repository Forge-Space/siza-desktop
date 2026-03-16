import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CHANNELS } from '../../shared/bridge';
import type { SignInResult, AuthSession } from '../../shared/bridge';

const handlers = new Map<string, (...args: unknown[]) => unknown>();

const mockWriteFileSync = vi.fn();
const mockReadFileSync = vi.fn();
const mockMkdirSync = vi.fn();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    }
  },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (s: string) => Buffer.from(s),
    decryptString: (b: Buffer) => b.toString()
  },
  app: {
    getPath: () => '/tmp/test-userdata'
  }
}));

vi.mock('node:fs', () => ({
  writeFileSync: mockWriteFileSync,
  readFileSync: mockReadFileSync,
  mkdirSync: mockMkdirSync
}));

const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut
    }
  })
}));

describe('registerAuthHandlers', () => {
  const mockSession = {
    access_token: 'access-tok',
    refresh_token: 'refresh-tok',
    user: { id: 'user-123', email: 'test@example.com' }
  };

  beforeEach(async () => {
    handlers.clear();
    mockWriteFileSync.mockReset();
    mockReadFileSync.mockReset();
    mockMkdirSync.mockReset();
    mockSignInWithPassword.mockReset();
    mockSignOut.mockReset();

    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });

    vi.resetModules();
    const mod = await import('./auth');
    mod.registerAuthHandlers();
  });

  it('registers auth handlers', () => {
    expect(handlers.has(CHANNELS.authSignIn)).toBe(true);
    expect(handlers.has(CHANNELS.authSignOut)).toBe(true);
    expect(handlers.has(CHANNELS.authGetSession)).toBe(true);
  });

  it('getSession returns null when no saved session', () => {
    const result = handlers.get(CHANNELS.authGetSession)!(null);
    expect(result).toBeNull();
  });

  it('signIn returns session on success', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: mockSession }, error: null });

    const result = await (handlers.get(CHANNELS.authSignIn)!(null, 'test@example.com', 'password') as Promise<SignInResult>);
    expect(result.error).toBeNull();
    expect(result.session).toMatchObject({
      accessToken: 'access-tok',
      refreshToken: 'refresh-tok',
      userId: 'user-123',
      email: 'test@example.com'
    });
  });

  it('signIn persists session to disk', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: mockSession }, error: null });
    await handlers.get(CHANNELS.authSignIn)!(null, 'test@example.com', 'password');
    expect(mockWriteFileSync).toHaveBeenCalled();
  });

  it('signIn returns error on Supabase error', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid credentials' } });

    const result = await (handlers.get(CHANNELS.authSignIn)!(null, 'bad@example.com', 'wrong') as Promise<SignInResult>);
    expect(result.error).toBe('Invalid credentials');
    expect(result.session).toBeNull();
  });

  it('signIn returns error when session is null', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: null }, error: null });

    const result = await (handlers.get(CHANNELS.authSignIn)!(null, 'test@example.com', 'pass') as Promise<SignInResult>);
    expect(result.error).toBe('Sign in failed');
  });

  it('getSession returns active session after signIn', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: mockSession }, error: null });
    await handlers.get(CHANNELS.authSignIn)!(null, 'test@example.com', 'password');

    const session = handlers.get(CHANNELS.authGetSession)!(null) as AuthSession;
    expect(session.email).toBe('test@example.com');
  });

  it('signOut clears session and calls supabase signOut', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: mockSession }, error: null });
    await handlers.get(CHANNELS.authSignIn)!(null, 'test@example.com', 'password');
    mockSignOut.mockResolvedValue({});

    await handlers.get(CHANNELS.authSignOut)!(null);
    expect(handlers.get(CHANNELS.authGetSession)!(null)).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('signOut without session does not call supabase signOut', async () => {
    mockSignOut.mockResolvedValue({});
    await handlers.get(CHANNELS.authSignOut)!(null);
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
