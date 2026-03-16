import { ipcMain } from 'electron';
import { generateComponent, DEFAULT_DESIGN_CONTEXT } from '@forgespace/siza-gen';
import type { Framework, ComponentLibrary } from '@forgespace/siza-gen';
import { CHANNELS } from '../../shared/bridge';
import type { GenerateComponentRequest, GenerateComponentResult } from '../../shared/bridge';

export function registerGenerateHandlers(): void {
  ipcMain.handle(
    CHANNELS.generateComponent,
    (_event, req: GenerateComponentRequest): GenerateComponentResult => {
      try {
        const files = generateComponent(
          req.framework as Framework,
          req.componentType,
          req.props ?? {},
          DEFAULT_DESIGN_CONTEXT,
          req.componentLibrary as ComponentLibrary | undefined
        );
        return { files, error: null };
      } catch (err) {
        return { files: [], error: err instanceof Error ? err.message : String(err) };
      }
    }
  );
}
