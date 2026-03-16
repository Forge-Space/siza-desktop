import { useState, useEffect } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import type { UpdateStatus } from '../../shared/bridge';

export default function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const s = await window.desktop.updater.status();
        setStatus(s);
      } catch {
        // updater not available in dev
      }
    };
    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Reset dismissed state when the update status changes
  const stateKey = status.state;
  useEffect(() => {
    setDismissed(false);
  }, [stateKey]);

  if (dismissed) return null;
  if (status.state !== 'available' && status.state !== 'downloading' && status.state !== 'ready') return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm">
      <span className="flex-1 text-foreground">
        {status.state === 'available' && `Update v${status.version} available`}
        {status.state === 'downloading' && `Downloading update… ${status.percent ?? 0}%`}
        {status.state === 'ready' && `Update v${status.version} ready to install`}
      </span>

      {status.state === 'available' && (
        <button
          onClick={async () => {
            const s = await window.desktop.updater.download();
            setStatus(s);
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Download size={12} /> Download
        </button>
      )}

      {status.state === 'ready' && (
        <button
          onClick={() => window.desktop.updater.install()}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw size={12} /> Restart & install
        </button>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-muted text-muted-foreground"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
