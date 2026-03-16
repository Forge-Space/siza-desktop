import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import React from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(MemoryRouter, null, children);
}

function fireKeydown(key: string, opts: { metaKey?: boolean; ctrlKey?: boolean } = {}) {
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      metaKey: opts.metaKey ?? false,
      ctrlKey: opts.ctrlKey ?? false,
      bubbles: true,
    })
  );
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('navigates to /generate on Cmd+G', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKeydown('g', { metaKey: true });
    expect(mockNavigate).toHaveBeenCalledWith('/generate');
  });

  it('navigates to /history on Cmd+H', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKeydown('h', { metaKey: true });
    expect(mockNavigate).toHaveBeenCalledWith('/history');
  });

  it('navigates to /models on Cmd+M', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKeydown('m', { metaKey: true });
    expect(mockNavigate).toHaveBeenCalledWith('/models');
  });

  it('navigates to /settings on Cmd+,', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKeydown(',', { metaKey: true });
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('navigates on Ctrl+G (Windows/Linux)', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKeydown('g', { ctrlKey: true });
    expect(mockNavigate).toHaveBeenCalledWith('/generate');
  });

  it('does not navigate without meta/ctrl modifier', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKeydown('g');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate for unregistered key', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKeydown('z', { metaKey: true });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when focus is in an input', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'g',
        metaKey: true,
        bubbles: true,
      })
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('does not navigate when focus is in a textarea', () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'g',
        metaKey: true,
        bubbles: true,
      })
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('removes event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardShortcuts(), { wrapper });
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });
});
