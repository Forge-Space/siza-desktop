import { useEffect, useState } from 'react';
import { Sparkles, Copy, Check, AlertCircle, FileCode, Zap, Download } from 'lucide-react';
import type { OllamaModel, GeneratedFile } from '../../shared/bridge';
import { cn } from '../lib/utils';

const FRAMEWORKS = ['react', 'vue', 'svelte', 'angular'] as const;
type Framework = typeof FRAMEWORKS[number];

const COMPONENT_LIBRARIES = ['shadcn', 'radix', 'headlessui', 'none'] as const;
type ComponentLibrary = typeof COMPONENT_LIBRARIES[number];

export default function GeneratePage() {
  const [componentType, setComponentType] = useState('');
  const [framework, setFramework] = useState<Framework>('react');
  const [componentLibrary, setComponentLibrary] = useState<ComponentLibrary>('shadcn');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [ollamaHealthy, setOllamaHealthy] = useState<boolean | null>(null);
  const [useLlm, setUseLlm] = useState(false);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmUsed, setLlmUsed] = useState<boolean | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedTo, setSavedTo] = useState<string | null>(null);

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
    if (!componentType.trim()) return;
    setError(null);
    setFiles([]);
    setActiveFile(0);
    setLlmUsed(null);
    setUsedModel(null);
    setLoading(true);
    try {
      const result = await window.desktop.generate.component({
        framework,
        componentType: componentType.trim(),
        componentLibrary,
        useLlm: useLlm && ollamaHealthy === true,
        model: selectedModel || undefined,
      });
      if (result.error) throw new Error(result.error);
      setFiles(result.files);
      setLlmUsed(result.llmUsed ?? false);
      setUsedModel(result.model ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToDisk() {
    if (!files.length) return;
    setSaving(true);
    setSaveError(null);
    setSavedTo(null);
    try {
      const result = await window.desktop.files.saveGenerated({ files });
      if (result.error) throw new Error(result.error);
      setSavedTo(result.savedTo);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    const content = files[activeFile]?.content ?? '';
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Generate</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered component generation via siza-gen
        </p>
      </div>

      {ollamaHealthy === false && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Ollama is not running. Template generation still works — start Ollama to enable LLM mode.
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="space-y-1">
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

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Component library</label>
            <div className="flex gap-1">
              {COMPONENT_LIBRARIES.map(lib => (
                <button
                  key={lib}
                  type="button"
                  onClick={() => setComponentLibrary(lib)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    componentLibrary === lib
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {lib}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="componentType" className="text-sm font-medium text-foreground">
            Component type
          </label>
          <input
            id="componentType"
            type="text"
            value={componentType}
            onChange={e => setComponentType(e.target.value)}
            className={cn(
              'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'
            )}
            placeholder="button, card, modal, form, navbar…"
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => setUseLlm(v => !v)}
            disabled={!ollamaHealthy}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              useLlm && ollamaHealthy
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-muted text-muted-foreground border border-transparent',
              !ollamaHealthy && 'cursor-not-allowed opacity-40'
            )}
            title={!ollamaHealthy ? 'Start Ollama to enable LLM mode' : undefined}
          >
            <Zap className="w-3.5 h-3.5" />
            LLM mode
          </button>

          {useLlm && ollamaHealthy && models.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="modelSelect" className="text-sm font-medium text-foreground">Model</label>
              <select
                id="modelSelect"
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className={cn(
                  'rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring'
                )}
              >
                {models.map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !componentType.trim()}
            className={cn(
              'flex items-center gap-2 rounded-md bg-primary text-primary-foreground font-medium px-4 py-2 text-sm',
              'hover:bg-primary/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {files.map((file, i) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setActiveFile(i)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors',
                    activeFile === i
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <FileCode className="w-3 h-3" />
                  {file.path.split('/').pop()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {llmUsed !== null && (
                <span className={cn(
                  'flex items-center gap-1 text-xs',
                  llmUsed ? 'text-primary' : 'text-muted-foreground'
                )}>
                  <Zap className="w-3 h-3" />
                  {llmUsed ? `LLM${usedModel ? ` · ${usedModel}` : ''}` : 'Template'}
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveToDisk}
                disabled={saving}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
                {saving ? 'Saving…' : 'Save to disk'}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <pre className={cn(
            'rounded-md border border-border bg-muted p-4 text-sm font-mono',
            'overflow-auto max-h-[480px] whitespace-pre text-foreground'
          )}>
            {files[activeFile]?.content}
          </pre>
          {saveError && (
            <p className="text-xs text-destructive mt-1">{saveError}</p>
          )}
          {savedTo && (
            <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
              Saved to {savedTo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
