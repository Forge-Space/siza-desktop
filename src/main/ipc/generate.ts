import { ipcMain } from 'electron';
import { generateComponent, OllamaProvider, DEFAULT_DESIGN_CONTEXT } from '@forgespace/siza-gen';
import type { Framework, ComponentLibrary } from '@forgespace/siza-gen';
import { CHANNELS } from '../../shared/bridge';
import type { GenerateComponentRequest, GenerateComponentResult } from '../../shared/bridge';
import { getBaseUrl } from './ollama';

function buildLlmPrompt(req: GenerateComponentRequest): string {
  const lib = req.componentLibrary && req.componentLibrary !== 'none'
    ? ` using ${req.componentLibrary}`
    : '';
  return [
    `Generate a ${req.framework} component called "${req.componentType}"${lib}.`,
    'Requirements:',
    '- TypeScript with proper types',
    '- Tailwind CSS for styling',
    `- Framework: ${req.framework}`,
    lib ? `- Component library: ${req.componentLibrary}` : '- No component library',
    '- Production-ready, accessible, clean code',
    '- Include all necessary imports',
    '',
    'Output ONLY the component code, no explanation, no markdown fences.',
  ].join('\n');
}

function fileExtension(framework: string): string {
  switch (framework) {
    case 'vue': return '.vue';
    case 'svelte': return '.svelte';
    default: return '.tsx';
  }
}

export function registerGenerateHandlers(): void {
  ipcMain.handle(
    CHANNELS.generateComponent,
    async (_event, req: GenerateComponentRequest): Promise<GenerateComponentResult> => {
      if (req.useLlm) {
        try {
          const baseUrl = getBaseUrl();
          const provider = new OllamaProvider({
            model: req.model ?? 'llama3.2',
            baseUrl,
          });
          const available = await provider.isAvailable();
          if (!available) {
            return { files: [], error: 'Ollama is not available. Start Ollama and ensure a model is loaded.', llmUsed: false };
          }
          const prompt = buildLlmPrompt(req);
          const response = await provider.generate(prompt);
          const ext = fileExtension(req.framework);
          const name = req.componentType
            .split(/[\s_-]+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join('');
          return {
            files: [{ path: `${name}${ext}`, content: response.text }],
            error: null,
            llmUsed: true,
            model: response.model,
          };
        } catch (err) {
          return {
            files: [],
            error: err instanceof Error ? err.message : String(err),
            llmUsed: false,
          };
        }
      }

      try {
        const files = generateComponent(
          req.framework as Framework,
          req.componentType,
          req.props ?? {},
          DEFAULT_DESIGN_CONTEXT,
          req.componentLibrary as ComponentLibrary | undefined
        );
        return { files, error: null, llmUsed: false };
      } catch (err) {
        return { files: [], error: err instanceof Error ? err.message : String(err) };
      }
    }
  );
}
