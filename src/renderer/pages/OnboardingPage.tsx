import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Wifi, WifiOff, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

type Step = 'welcome' | 'ollama' | 'auth';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [ollamaError, setOllamaError] = useState('');

  async function checkOllama() {
    setOllamaStatus('checking');
    setOllamaError('');
    try {
      await window.desktop.ollama.setBaseUrl(ollamaUrl);
      const status = await window.desktop.ollama.getStatus();
      if (status.healthy) {
        setOllamaStatus('ok');
      } else {
        setOllamaStatus('error');
        setOllamaError(status.error ?? 'Ollama not reachable');
      }
    } catch {
      setOllamaStatus('error');
      setOllamaError('Connection failed');
    }
  }

  async function finishOnboarding() {
    await window.desktop.onboarding.complete(ollamaUrl);
    navigate('/auth/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        {step === 'welcome' && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">✦</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Welcome to Siza Desktop</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate UI components locally with AI. Let&apos;s get you set up.
              </p>
            </div>
            <button
              onClick={() => setStep('ollama')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Get started <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 'ollama' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Connect Ollama</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Siza uses Ollama for local AI generation. Make sure Ollama is running.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Ollama URL</label>
              <input
                type="url"
                value={ollamaUrl}
                onChange={(e) => {
                  setOllamaUrl(e.target.value);
                  setOllamaStatus('idle');
                }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="http://localhost:11434"
              />
            </div>

            <button
              onClick={checkOllama}
              disabled={ollamaStatus === 'checking'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {ollamaStatus === 'checking' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : ollamaStatus === 'ok' ? (
                <CheckCircle size={14} className="text-green-500" />
              ) : ollamaStatus === 'error' ? (
                <WifiOff size={14} className="text-destructive" />
              ) : (
                <Wifi size={14} />
              )}
              Test connection
            </button>

            {ollamaStatus === 'ok' && (
              <p className="text-sm text-green-500 flex items-center gap-1">
                <CheckCircle size={13} /> Ollama is reachable
              </p>
            )}
            {ollamaStatus === 'error' && (
              <p className="text-sm text-destructive">{ollamaError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('welcome')}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('auth')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>

            {ollamaStatus !== 'ok' && (
              <p className="text-xs text-muted-foreground text-center">
                You can skip this and configure Ollama later in Settings.
              </p>
            )}
          </div>
        )}

        {step === 'auth' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Sign in to Forge Space</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A Forge Space account lets you sync your settings and generation history.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <span className="text-sm text-foreground">Ollama configured</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <span className="text-sm text-foreground">Siza Desktop ready</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('ollama')}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                onClick={finishOnboarding}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Sign in <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
