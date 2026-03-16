import { ipcMain, app } from 'electron';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { OnboardingState } from '../../shared/bridge';
import { setBaseUrl } from './ollama';

const stateFile = join(app.getPath('userData'), 'onboarding.json');

async function readState(): Promise<OnboardingState> {
  try {
    const raw = await readFile(stateFile, 'utf-8');
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return { completed: false };
  }
}

async function writeState(state: OnboardingState): Promise<void> {
  await mkdir(join(app.getPath('userData')), { recursive: true });
  await writeFile(stateFile, JSON.stringify(state), 'utf-8');
}

export function registerOnboardingHandlers(): void {
  ipcMain.handle('onboarding:get-state', async (): Promise<OnboardingState> => {
    return readState();
  });

  ipcMain.handle('onboarding:complete', async (_event, ollamaUrl: string): Promise<void> => {
    if (ollamaUrl) {
      setBaseUrl(ollamaUrl);
    }
    await writeState({ completed: true, ollamaUrl });
  });

  ipcMain.handle('onboarding:reset', async (): Promise<void> => {
    await writeState({ completed: false });
  });
}
