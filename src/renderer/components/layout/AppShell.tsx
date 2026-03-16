import { useNavigate, useLocation } from 'react-router';
import { Sparkles, Settings, Package } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { to: '/generate', icon: Sparkles, label: 'Generate' },
  { to: '/models', icon: Package, label: 'Models' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-14 flex flex-col items-center py-4 border-r border-border gap-2">
        <div className="mb-4">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            title={label}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-md transition-colors',
              pathname === to
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
