import { ipcMain, dialog, app } from 'electron';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

export interface SaveFilesRequest {
  files: Array<{ path: string; content: string }>;
  defaultDir?: string;
}

export interface SaveFilesResult {
  savedTo: string | null;
  error: string | null;
}

export function registerFilesHandlers(): void {
  ipcMain.handle('files:save-generated', async (_event, req: SaveFilesRequest): Promise<SaveFilesResult> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Choose export folder',
      defaultPath: req.defaultDir ?? app.getPath('documents'),
      properties: ['openDirectory', 'createDirectory']
    });

    if (canceled || filePaths.length === 0) {
      return { savedTo: null, error: null };
    }

    const targetDir = filePaths[0];
    try {
      for (const file of req.files) {
        const dest = join(targetDir, file.path);
        await mkdir(dirname(dest), { recursive: true });
        await writeFile(dest, file.content, 'utf-8');
      }
      return { savedTo: targetDir, error: null };
    } catch (err) {
      return { savedTo: null, error: err instanceof Error ? err.message : 'Write failed' };
    }
  });
}
