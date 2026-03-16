import { useEffect } from 'react';
import { useNavigate } from 'react-router';

const SHORTCUTS: { key: string; path: string }[] = [
  { key: 'g', path: '/generate' },
  { key: 'h', path: '/history' },
  { key: 'm', path: '/models' },
  { key: ',', path: '/settings' },
];

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (isInput) return;

      const match = SHORTCUTS.find(s => s.key === e.key);
      if (match) {
        e.preventDefault();
        navigate(match.path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}

export const SHORTCUT_LABELS: Record<string, string> = {
  '/generate': '⌘G',
  '/history': '⌘H',
  '/models': '⌘M',
  '/settings': '⌘,',
};
