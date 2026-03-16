import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenerationHistory } from './useGenerationHistory';
import type { HistoryEntry } from './useGenerationHistory';

const STORAGE_KEY = 'siza:generation-history';

const makeEntry = (overrides: Partial<Omit<HistoryEntry, 'id' | 'timestamp'>> = {}) => ({
  componentType: 'Button',
  framework: 'react',
  componentLibrary: 'shadcn',
  useLlm: false,
  files: [],
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

describe('useGenerationHistory', () => {
  it('returns empty history initially', () => {
    const { result } = renderHook(() => useGenerationHistory());
    expect(result.current.history).toEqual([]);
  });

  it('addEntry adds to history with id and timestamp', () => {
    const { result } = renderHook(() => useGenerationHistory());

    act(() => {
      result.current.addEntry(makeEntry());
    });

    expect(result.current.history).toHaveLength(1);
    const entry = result.current.history[0];
    expect(entry.id).toBeDefined();
    expect(typeof entry.id).toBe('string');
    expect(entry.timestamp).toBeGreaterThan(0);
    expect(entry.componentType).toBe('Button');
  });

  it('addEntry prepends newest entry to history', () => {
    const { result } = renderHook(() => useGenerationHistory());

    act(() => {
      result.current.addEntry(makeEntry({ componentType: 'Card' }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ componentType: 'Input' }));
    });

    expect(result.current.history[0].componentType).toBe('Input');
    expect(result.current.history[1].componentType).toBe('Card');
  });

  it('addEntry caps at 20 entries', () => {
    const { result } = renderHook(() => useGenerationHistory());

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addEntry(makeEntry({ componentType: `Component${i}` }));
      }
    });

    expect(result.current.history).toHaveLength(20);
    // Most recent should be Component24
    expect(result.current.history[0].componentType).toBe('Component24');
    // Oldest kept should be Component5
    expect(result.current.history[19].componentType).toBe('Component5');
  });

  it('clearHistory empties history', () => {
    const { result } = renderHook(() => useGenerationHistory());

    act(() => {
      result.current.addEntry(makeEntry());
      result.current.addEntry(makeEntry({ componentType: 'Input' }));
    });
    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toEqual([]);
  });

  it('clearHistory removes from localStorage', () => {
    const { result } = renderHook(() => useGenerationHistory());

    act(() => {
      result.current.addEntry(makeEntry());
    });
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    act(() => {
      result.current.clearHistory();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('history persists across hook re-mounts (reads from localStorage)', () => {
    const { result: first } = renderHook(() => useGenerationHistory());

    act(() => {
      first.current.addEntry(makeEntry({ componentType: 'Persisted' }));
    });

    // Unmount and remount — hook should re-read localStorage
    const { result: second } = renderHook(() => useGenerationHistory());
    expect(second.current.history).toHaveLength(1);
    expect(second.current.history[0].componentType).toBe('Persisted');
  });

  it('handles corrupt localStorage gracefully (returns [])', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{{');

    const { result } = renderHook(() => useGenerationHistory());
    expect(result.current.history).toEqual([]);
  });

  it('each addEntry generates a unique id', () => {
    const { result } = renderHook(() => useGenerationHistory());

    act(() => {
      result.current.addEntry(makeEntry());
      result.current.addEntry(makeEntry());
    });

    const ids = result.current.history.map(e => e.id);
    expect(new Set(ids).size).toBe(2);
  });
});
