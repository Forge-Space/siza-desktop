import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CHANNELS } from '../../shared/bridge';
import type { GenerateComponentRequest } from '../../shared/bridge';

const handlers = new Map<string, (...args: unknown[]) => unknown>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    }
  }
}));

const mockFiles = [{ path: 'Button.tsx', content: 'export const Button = () => <button />', language: 'tsx', encoding: 'utf-8' }];
const mockGenerateComponent = vi.fn().mockReturnValue(mockFiles);

vi.mock('@forgespace/siza-gen', () => ({
  generateComponent: mockGenerateComponent,
  DEFAULT_DESIGN_CONTEXT: { primaryColor: '#7C3AED' }
}));

const { registerGenerateHandlers } = await import('./generate');

describe('registerGenerateHandlers', () => {
  beforeEach(() => {
    handlers.clear();
    mockGenerateComponent.mockReset();
    mockGenerateComponent.mockReturnValue(mockFiles);
    registerGenerateHandlers();
  });

  it('registers generateComponent handler', () => {
    expect(handlers.has(CHANNELS.generateComponent)).toBe(true);
  });

  it('returns files from generateComponent', () => {
    const req: GenerateComponentRequest = {
      framework: 'react',
      componentType: 'Button',
      props: { label: 'Click me' }
    };
    const result = handlers.get(CHANNELS.generateComponent)!(null, req);
    expect(result).toEqual({ files: mockFiles, error: null });
  });

  it('passes framework, componentType, props, designContext to siza-gen', () => {
    const req: GenerateComponentRequest = {
      framework: 'vue',
      componentType: 'Card',
      props: { title: 'Hello' },
      componentLibrary: 'shadcn'
    };
    handlers.get(CHANNELS.generateComponent)!(null, req);
    expect(mockGenerateComponent).toHaveBeenCalledWith(
      'vue',
      'Card',
      { title: 'Hello' },
      { primaryColor: '#7C3AED' },
      'shadcn'
    );
  });

  it('uses empty props when not provided', () => {
    const req: GenerateComponentRequest = {
      framework: 'react',
      componentType: 'Button'
    };
    handlers.get(CHANNELS.generateComponent)!(null, req);
    expect(mockGenerateComponent).toHaveBeenCalledWith(
      'react', 'Button', {}, { primaryColor: '#7C3AED' }, undefined
    );
  });

  it('returns error when generateComponent throws', () => {
    mockGenerateComponent.mockImplementation(() => { throw new Error('generation failed'); });
    const req: GenerateComponentRequest = { framework: 'react', componentType: 'Button' };
    const result = handlers.get(CHANNELS.generateComponent)!(null, req);
    expect(result).toEqual({ files: [], error: 'generation failed' });
  });

  it('returns string error for non-Error throws', () => {
    mockGenerateComponent.mockImplementation(() => { throw 'unknown error'; });
    const req: GenerateComponentRequest = { framework: 'react', componentType: 'Button' };
    const result = handlers.get(CHANNELS.generateComponent)!(null, req);
    expect(result).toEqual({ files: [], error: 'unknown error' });
  });
});
