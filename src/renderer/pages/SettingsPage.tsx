import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const { session, signOut } = useAuth();
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    window.desktop.ollama.getBaseUrl().then(setOllamaUrl);
  }, []);

  async function handleSaveUrl(e: React.FormEvent) {
    e.preventDefault();
    await window.desktop.ollama.setBaseUrl(ollamaUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure Siza Desktop</p>
      </div>

      <section className="space-y-4" aria-labelledby="ollama-heading">
        <h2 id="ollama-heading" className="text-sm font-semibold text-foreground uppercase tracking-wider">Ollama</h2>
        <form onSubmit={handleSaveUrl} className="flex gap-2" aria-label="Ollama URL settings">
          <label htmlFor="ollama-url" className="sr-only">Ollama base URL</label>
          <input
            id="ollama-url"
            type="url"
            value={ollamaUrl}
            onChange={e => setOllamaUrl(e.target.value)}
            className={cn(
              'flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'
            )}
            placeholder="http://localhost:11434"
          />
          <button
            type="submit"
            className="rounded-md bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
        </form>
        {saved && (
          <p role="status" className="sr-only">Ollama URL saved successfully</p>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-sm font-semibold text-foreground uppercase tracking-wider">Account</h2>
        {session && (
          <p className="text-sm text-muted-foreground">Signed in as <span className="text-foreground">{session.email}</span></p>
        )}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          aria-busy={signingOut}
          className={cn(
            'rounded-md border border-destructive text-destructive text-sm font-medium px-4 py-2',
            'hover:bg-destructive hover:text-destructive-foreground transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </section>
    </div>
  );
}
