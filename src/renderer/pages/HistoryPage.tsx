import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { History, Trash2, RefreshCw, Search, Filter, X } from 'lucide-react';
import { useGenerationHistory, type HistoryEntry } from '../hooks/useGenerationHistory';
import { cn } from '../lib/utils';

const FRAMEWORKS = ['all', 'react', 'vue', 'svelte', 'angular'] as const;

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function EntryCard({ entry, onRerun, onSelect, selected }: {
  entry: HistoryEntry;
  onRerun: (e: HistoryEntry) => void;
  onSelect: (e: HistoryEntry) => void;
  selected: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(entry)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(entry)}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-colors',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{entry.componentType || '(unnamed)'}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
              {entry.framework}
            </span>
            {entry.componentLibrary !== 'none' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {entry.componentLibrary}
              </span>
            )}
            {entry.useLlm && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {entry.model ? `LLM · ${entry.model}` : 'LLM'}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {entry.files.length} file{entry.files.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(entry.timestamp)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRerun(entry); }}
            title="Re-run"
            className="ml-1 p-1.5 rounded hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { history, clearHistory } = useGenerationHistory();
  const [search, setSearch] = useState('');
  const [framework, setFramework] = useState<typeof FRAMEWORKS[number]>('all');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [activeFile, setActiveFile] = useState(0);

  const filtered = useMemo(() => {
    return history.filter((e) => {
      const matchesSearch = !search ||
        e.componentType.toLowerCase().includes(search.toLowerCase()) ||
        e.framework.toLowerCase().includes(search.toLowerCase()) ||
        e.componentLibrary.toLowerCase().includes(search.toLowerCase());
      const matchesFramework = framework === 'all' || e.framework === framework;
      return matchesSearch && matchesFramework;
    });
  }, [history, search, framework]);

  function handleRerun(entry: HistoryEntry) {
    navigate('/generate', { state: { rerun: entry } });
  }

  function handleSelect(entry: HistoryEntry) {
    setSelectedEntry(entry === selectedEntry ? null : entry);
    setActiveFile(0);
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <History className="w-12 h-12 text-muted-foreground" />
        <div>
          <p className="font-medium">No generation history</p>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a component to see it here.
          </p>
        </div>
        <button
          onClick={() => navigate('/generate')}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
        >
          Go to Generate
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Generation History</h1>
          <p className="text-sm text-muted-foreground">{history.length} generation{history.length !== 1 ? 's' : ''} stored</p>
        </div>
        <button
          onClick={clearHistory}
          title="Clear all history"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors border border-destructive/30"
        >
          <Trash2 className="w-4 h-4" />
          Clear all
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by component, framework..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 border border-border rounded-md px-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value as typeof FRAMEWORKS[number])}
            className="text-sm bg-transparent py-2 focus:outline-none capitalize"
          >
            {FRAMEWORKS.map((f) => (
              <option key={f} value={f} className="capitalize">{f}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center">
          <p className="text-muted-foreground">No results match your filters.</p>
          <button
            onClick={() => { setSearch(''); setFramework('all'); }}
            className="text-sm text-primary underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
            {filtered.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onRerun={handleRerun}
                onSelect={handleSelect}
                selected={selectedEntry?.id === entry.id}
              />
            ))}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {selectedEntry ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedEntry.files.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveFile(i)}
                      className={cn(
                        'px-3 py-1 rounded-md text-xs font-mono transition-colors',
                        activeFile === i
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {f.path}
                    </button>
                  ))}
                  <button
                    onClick={() => handleRerun(selectedEntry)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-md text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Re-run
                  </button>
                </div>
                <pre className="flex-1 overflow-auto rounded-lg bg-muted p-4 text-xs font-mono text-foreground">
                  <code>{selectedEntry.files[activeFile]?.content ?? ''}</code>
                </pre>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center text-muted-foreground">
                <History className="w-8 h-8" />
                <p className="text-sm">Select an entry to view its code</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
