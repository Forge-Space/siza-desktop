import { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, RefreshCw, Package } from 'lucide-react';
import { cn } from '../lib/utils';
import type { OllamaModel, OllamaPullProgress } from '../../shared/bridge';

interface PullState {
  modelName: string;
  progress: OllamaPullProgress | null;
  running: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function ModelManagerPage() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pullInput, setPullInput] = useState('');
  const [pullState, setPullState] = useState<PullState | null>(null);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.desktop.ollama.getModels();
      setModels(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handlePull = async () => {
    const name = pullInput.trim();
    if (!name || pullState?.running) return;
    setPullState({ modelName: name, progress: null, running: true });
    setDeleteError(null);
    try {
      await window.desktop.ollama.pullModel(name, (p) => {
        setPullState(prev => prev ? { ...prev, progress: p } : null);
      });
      setPullInput('');
      await loadModels();
    } catch (err) {
      setPullState(prev => prev ? {
        ...prev,
        running: false,
        progress: { status: 'error', done: true, error: err instanceof Error ? err.message : 'Pull failed' }
      } : null);
      return;
    }
    setPullState(null);
  };

  const handleDelete = async (name: string) => {
    if (deletingModel) return;
    setDeletingModel(name);
    setDeleteError(null);
    const result = await window.desktop.ollama.deleteModel(name);
    setDeletingModel(null);
    if (!result.success) {
      setDeleteError(result.error ?? 'Delete failed');
    } else {
      setModels(prev => prev.filter(m => m.name !== name));
    }
  };

  const pullPercent = pullState?.progress?.total && pullState.progress.completed
    ? Math.round((pullState.progress.completed / pullState.progress.total) * 100)
    : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Model Manager</h1>
        <button
          onClick={loadModels}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Refresh models"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Pull a model */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-foreground mb-3">Pull a model</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={pullInput}
            onChange={e => setPullInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePull()}
            placeholder="e.g. llama3.2, mistral, codellama"
            disabled={pullState?.running}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={handlePull}
            disabled={!pullInput.trim() || pullState?.running}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Pull
          </button>
        </div>

        {pullState && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{pullState.progress?.status ?? 'Starting…'}</span>
              {pullPercent !== null && <span>{pullPercent}%</span>}
            </div>
            {pullPercent !== null && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${pullPercent}%` }}
                />
              </div>
            )}
            {pullState.progress?.error && (
              <p className="mt-1 text-xs text-destructive">{pullState.progress.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Installed models */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">
            Installed models{models.length > 0 && ` (${models.length})`}
          </h2>
        </div>

        {error && (
          <div className="px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {deleteError && (
          <div className="px-4 py-3 text-sm text-destructive">{deleteError}</div>
        )}

        {!loading && !error && models.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Package className="h-8 w-8 opacity-40" />
            <p className="text-sm">No models installed</p>
            <p className="text-xs">Pull a model above to get started</p>
          </div>
        )}

        {models.map(model => (
          <div
            key={model.name}
            className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{model.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(model.size)}</p>
            </div>
            <button
              onClick={() => handleDelete(model.name)}
              disabled={deletingModel === model.name}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              aria-label={`Delete ${model.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deletingModel === model.name ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
