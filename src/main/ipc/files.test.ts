import { describe, it, expect, vi, beforeEach } from 'vitest';

const handlers = new Map<string, (...args: unknown[]) => unknown>();

const mockShowOpenDialog = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    }
  },
  dialog: {
    showOpenDialog: mockShowOpenDialog
  },
  app: {
    getPath: () => '/tmp/documents'
  }
}));

vi.mock('node:fs/promises', () => ({
  writeFile: mockWriteFile,
  mkdir: mockMkdir
}));

vi.mock('node:path', async () => {
  const actual = await vi.importActual<typeof import('node:path')>('node:path');
  return actual;
});

describe('registerFilesHandlers', () => {
  beforeEach(async () => {
    handlers.clear();
    mockShowOpenDialog.mockReset();
    mockWriteFile.mockReset();
    mockMkdir.mockReset();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    vi.resetModules();
    const mod = await import('./files');
    mod.registerFilesHandlers();
  });

  it('registers files:save-generated handler', () => {
    expect(handlers.has('files:save-generated')).toBe(true);
  });

  it('returns null savedTo when dialog is canceled', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });

    const result = await handlers.get('files:save-generated')!(null, {
      files: [{ path: 'Button.tsx', content: 'export default function Button() {}' }]
    }) as { savedTo: string | null; error: string | null };

    expect(result.savedTo).toBeNull();
    expect(result.error).toBeNull();
  });

  it('returns null savedTo when no directory selected', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: [] });

    const result = await handlers.get('files:save-generated')!(null, {
      files: [{ path: 'Button.tsx', content: 'code' }]
    }) as { savedTo: string | null; error: string | null };

    expect(result.savedTo).toBeNull();
    expect(result.error).toBeNull();
  });

  it('writes all files to chosen directory', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/tmp/my-project'] });

    const result = await handlers.get('files:save-generated')!(null, {
      files: [
        { path: 'src/Button.tsx', content: 'const Button = () => null' },
        { path: 'src/Button.test.tsx', content: 'test("renders", () => {})' }
      ]
    }) as { savedTo: string; error: string | null };

    expect(result.savedTo).toBe('/tmp/my-project');
    expect(result.error).toBeNull();
    expect(mockWriteFile).toHaveBeenCalledTimes(2);
    expect(mockMkdir).toHaveBeenCalledTimes(2);
  });

  it('passes correct file content to writeFile', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/out'] });

    await handlers.get('files:save-generated')!(null, {
      files: [{ path: 'Button.tsx', content: 'hello world' }]
    });

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('Button.tsx'),
      'hello world',
      'utf-8'
    );
  });

  it('uses defaultDir as dialog defaultPath when provided', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });

    await handlers.get('files:save-generated')!(null, {
      files: [],
      defaultDir: '/custom/default'
    });

    expect(mockShowOpenDialog).toHaveBeenCalledWith(
      expect.objectContaining({ defaultPath: '/custom/default' })
    );
  });

  it('returns error when writeFile throws', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/out'] });
    mockWriteFile.mockRejectedValue(new Error('Permission denied'));

    const result = await handlers.get('files:save-generated')!(null, {
      files: [{ path: 'Button.tsx', content: 'code' }]
    }) as { savedTo: string | null; error: string | null };

    expect(result.savedTo).toBeNull();
    expect(result.error).toBe('Permission denied');
  });

  it('returns generic error message for non-Error throws', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/out'] });
    mockWriteFile.mockRejectedValue('string error');

    const result = await handlers.get('files:save-generated')!(null, {
      files: [{ path: 'Button.tsx', content: 'code' }]
    }) as { savedTo: string | null; error: string | null };

    expect(result.error).toBe('Write failed');
  });
});
