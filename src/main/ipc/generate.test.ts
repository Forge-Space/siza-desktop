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
const mockIsAvailable = vi.fn().mockResolvedValue(true);
const mockGenerate = vi.fn().mockResolvedValue({ text: 'const Button = () => <button />', model: 'llama3.2', provider: 'ollama' });

vi.mock('@forgespace/siza-gen', () => ({
  generateComponent: mockGenerateComponent,
  DEFAULT_DESIGN_CONTEXT: { primaryColor: '#7C3AED' },
  OllamaProvider: vi.fn().mockImplementation(() => ({
    isAvailable: mockIsAvailable,
    generate: mockGenerate,
  })),
}));

const { registerGenerateHandlers } = await import('./generate');

describe('registerGenerateHandlers', () => {
  beforeEach(() => {
    handlers.clear();
    mockGenerateComponent.mockReset();
    mockGenerateComponent.mockReturnValue(mockFiles);
    mockIsAvailable.mockResolvedValue(true);
    mockGenerate.mockResolvedValue({ text: 'const Button = () => <button />', model: 'llama3.2', provider: 'ollama' });
    registerGenerateHandlers();
  });

  it('registers generateComponent handler', () => {
    expect(handlers.has(CHANNELS.generateComponent)).toBe(true);
  });

  it('returns files from generateComponent (template mode)', async () => {
    const req: GenerateComponentRequest = {
      framework: 'react',
      componentType: 'Button',
      props: { label: 'Click me' }
    };
    const result = await handlers.get(CHANNELS.generateComponent)!(null, req);
    expect(result).toEqual({ files: mockFiles, error: null, llmUsed: false });
  });

  it('passes framework, componentType, props, designContext to siza-gen', async () => {
    const req: GenerateComponentRequest = {
      framework: 'vue',
      componentType: 'Card',
      props: { title: 'Hello' },
      componentLibrary: 'shadcn'
    };
    await handlers.get(CHANNELS.generateComponent)!(null, req);
    expect(mockGenerateComponent).toHaveBeenCalledWith(
      'vue',
      'Card',
      { title: 'Hello' },
      { primaryColor: '#7C3AED' },
      'shadcn'
    );
  });

  it('uses empty props when not provided', async () => {
    const req: GenerateComponentRequest = {
      framework: 'react',
      componentType: 'Button'
    };
    await handlers.get(CHANNELS.generateComponent)!(null, req);
    expect(mockGenerateComponent).toHaveBeenCalledWith(
      'react', 'Button', {}, { primaryColor: '#7C3AED' }, undefined
    );
  });

  it('returns error when generateComponent throws', async () => {
    mockGenerateComponent.mockImplementation(() => { throw new Error('generation failed'); });
    const req: GenerateComponentRequest = { framework: 'react', componentType: 'Button' };
    const result = await handlers.get(CHANNELS.generateComponent)!(null, req);
    expect(result).toEqual({ files: [], error: 'generation failed' });
  });

  it('returns string error for non-Error throws', async () => {
    mockGenerateComponent.mockImplementation(() => { throw 'unknown error'; });
    const req: GenerateComponentRequest = { framework: 'react', componentType: 'Button' };
    const result = await handlers.get(CHANNELS.generateComponent)!(null, req);
    expect(result).toEqual({ files: [], error: 'unknown error' });
  });

  it('returns LLM-generated file when useLlm=true and Ollama available', async () => {
    const req: GenerateComponentRequest = {
      framework: 'react',
      componentType: 'Button',
      useLlm: true,
      model: 'llama3.2',
    };
    const result = await handlers.get(CHANNELS.generateComponent)!(null, req) as { files: unknown[], llmUsed: boolean, model: string, error: null };
    expect(result.llmUsed).toBe(true);
    expect(result.model).toBe('llama3.2');
    expect(result.error).toBeNull();
    expect(result.files).toHaveLength(1);
    expect((result.files[0] as { path: string }).path).toBe('Button.tsx');
  });

  it('returns error when useLlm=true but Ollama unavailable', async () => {
    mockIsAvailable.mockResolvedValue(false);
    const req: GenerateComponentRequest = {
      framework: 'react',
      componentType: 'Button',
      useLlm: true,
    };
    const result = await handlers.get(CHANNELS.generateComponent)!(null, req) as { llmUsed: boolean, error: string };
    expect(result.llmUsed).toBe(false);
    expect(result.error).toMatch(/not available/i);
  });

  it('falls back gracefully when OllamaProvider.generate throws', async () => {
    mockGenerate.mockRejectedValue(new Error('model not loaded'));
    const req: GenerateComponentRequest = {
      framework: 'react',
      componentType: 'Button',
      useLlm: true,
    };
    const result = await handlers.get(CHANNELS.generateComponent)!(null, req) as { llmUsed: boolean, error: string };
    expect(result.llmUsed).toBe(false);
    expect(result.error).toBe('model not loaded');
  });
});
