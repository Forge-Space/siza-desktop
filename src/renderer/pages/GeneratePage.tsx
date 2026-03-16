import { useEffect, useState } from 'react';
import { Sparkles, Copy, Check, AlertCircle } from 'lucide-react';
import type { OllamaModel } from '../../shared/bridge';
import { cn } from '../lib/utils';

const FRAMEWORKS = ['react', 'vue', 'svelte', 'angular'] as const;
type Framework = typeof FRAMEWORKS[number];

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [framework, setFramework] = useState<Framework>('react');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [ollamaHealthy, setOllamaHealthy] = useState<boolean | null>(null);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.desktop.ollama.getStatus().then(status => {
      setOllamaHealthy(status.healthy);
      if (status.healthy && status.models.length > 0) {
        setModels(status.models);
        setSelectedModel(status.models[0].name);
      }
    });
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || !selectedModel) return;
    setError(null);
    setOutput('');
    setLoading(true);
    try {
      const res = await fetch(`${await window.desktop.ollama.getBaseUrl()}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: `Generate a ${framework} component: ${prompt.trim()}. Return only the code, no explanation.`,
          stream: false
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { response: string };
      setOutput(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Generate</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered component generation via Ollama</p>
      </div>

      {ollamaHealthy === false && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Ollama is not running. Start it with <code className="font-mono">ollama serve</code> or update the URL in Settings.
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-foreground">Framework</label>
            <div className="flex gap-1">
              {FRAMEWORKS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFramework(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
                    framework === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {models.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="model" className="text-sm font-medium text-foreground">Model</label>
              <select
                id="model"
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className={cn(
                  'rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'
                )}
              >
                {models.map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="prompt" className="text-sm font-medium text-foreground">Component description</label>
          <textarea
            id="prompt"
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className={cn(
              'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'
            )}
            placeholder="A button component with variants: primary, secondary, destructive"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !ollamaHealthy || !selectedModel || !prompt.trim()}
          className={cn(
            'flex items-center gap-2 rounded-md bg-primary text-primary-foreground font-medium px-4 py-2 text-sm',
            'hover:bg-primary/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </form>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {output && (
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Output</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className={cn(
            'rounded-md border border-border bg-muted p-4 text-sm font-mono',
            'overflow-auto max-h-96 whitespace-pre-wrap text-foreground'
          )}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
