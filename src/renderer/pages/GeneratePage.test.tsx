import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneratePage from './GeneratePage';

const mockDesktop = (window as unknown as { desktop: typeof window.desktop }).desktop;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  (mockDesktop.ollama.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
    healthy: false,
    models: [],
    error: null,
  });
  (mockDesktop.generate.component as ReturnType<typeof vi.fn>).mockResolvedValue({
    files: [{ path: 'Button.tsx', content: 'export function Button() {}', language: 'tsx' }],
    error: null,
    llmUsed: false,
  });
  (mockDesktop.files.saveGenerated as ReturnType<typeof vi.fn>).mockResolvedValue({
    savedTo: '/home/user/components',
    error: null,
  });
});

describe('GeneratePage', () => {
  it('renders heading and component type input', async () => {
    render(<GeneratePage />);
    expect(screen.getByRole('heading', { name: 'Generate' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/button, card, modal/i)).toBeInTheDocument();
  });

  it('shows Ollama warning banner when Ollama is not running', async () => {
    render(<GeneratePage />);
    await waitFor(() => {
      expect(screen.getByText(/ollama is not running/i)).toBeInTheDocument();
    });
  });

  it('does not show Ollama warning when Ollama is healthy', async () => {
    (mockDesktop.ollama.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      healthy: true,
      models: [{ name: 'llama2' }],
      error: null,
    });
    render(<GeneratePage />);
    await waitFor(() => {
      expect(screen.queryByText(/ollama is not running/i)).not.toBeInTheDocument();
    });
  });

  it('disables Generate button when component type is empty', async () => {
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));
    const btn = screen.getByRole('button', { name: /generate/i });
    expect(btn).toBeDisabled();
  });

  it('generates component and shows code output', async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('export function Button() {}')).toBeInTheDocument();
    });
  });

  it('shows template badge after template generation', async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('Template')).toBeInTheDocument();
    });
  });

  it('shows error message when generation fails', async () => {
    (mockDesktop.generate.component as ReturnType<typeof vi.fn>).mockResolvedValue({
      files: [],
      error: 'Generation failed',
    });
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'card');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('Generation failed')).toBeInTheDocument();
    });
  });

  it('shows file tab for generated file', async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('Button.tsx')).toBeInTheDocument();
    });
  });

  it('saves to disk and shows saved path', async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => screen.getByText('Button.tsx'));

    await user.click(screen.getByRole('button', { name: /save to disk/i }));
    await waitFor(() => {
      expect(screen.getByText(/saved to.*home\/user\/components/i)).toBeInTheDocument();
    });
  });

  it('shows save error when save fails', async () => {
    (mockDesktop.files.saveGenerated as ReturnType<typeof vi.fn>).mockResolvedValue({
      savedTo: null,
      error: 'Save failed',
    });
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => screen.getByText('Button.tsx'));

    await user.click(screen.getByRole('button', { name: /save to disk/i }));
    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('shows history button after first generation', async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    expect(screen.queryByText(/history/i)).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => screen.getByText('Button.tsx'));

    expect(screen.getByText(/history \(1\)/i)).toBeInTheDocument();
  });

  it('toggles history panel when history button clicked', async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => screen.getByText('Button.tsx'));

    const histBtn = screen.getByText(/history \(1\)/i);
    await user.click(histBtn);
    expect(screen.getByText('Recent generations')).toBeInTheDocument();

    await user.click(histBtn);
    expect(screen.queryByText('Recent generations')).not.toBeInTheDocument();
  });

  it('disables LLM mode toggle when Ollama is not healthy', async () => {
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));
    const llmBtn = screen.getByRole('button', { name: /llm mode/i });
    expect(llmBtn).toBeDisabled();
  });

  it('enables LLM mode toggle when Ollama is healthy', async () => {
    (mockDesktop.ollama.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      healthy: true,
      models: [{ name: 'llama2' }],
      error: null,
    });
    render(<GeneratePage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /llm mode/i })).not.toBeDisabled();
    });
  });

  it('shows model selector when LLM mode enabled and Ollama healthy', async () => {
    (mockDesktop.ollama.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      healthy: true,
      models: [{ name: 'llama2' }, { name: 'mistral' }],
      error: null,
    });
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByRole('button', { name: /llm mode/i }));

    await user.click(screen.getByRole('button', { name: /llm mode/i }));
    await waitFor(() => {
      expect(screen.getByLabelText('Model')).toBeInTheDocument();
    });
  });

  it('framework tabs switch framework selection', async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    const vueBtn = screen.getByRole('button', { name: /^vue$/i });
    await user.click(vueBtn);
    expect(vueBtn).toHaveClass('bg-primary');

    const reactBtn = screen.getByRole('button', { name: /^react$/i });
    expect(reactBtn).not.toHaveClass('bg-primary');
  });

  it('copies code to clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => screen.getByText('Button.tsx'));

    await user.click(screen.getByRole('button', { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith('export function Button() {}');
  });

  it('switches active file tab when multiple files generated', async () => {
    (mockDesktop.generate.component as ReturnType<typeof vi.fn>).mockResolvedValue({
      files: [
        { path: 'Button.tsx', content: 'export function Button() {}', language: 'tsx' },
        { path: 'Button.test.tsx', content: 'describe("Button", () => {})', language: 'tsx' },
      ],
      error: null,
      llmUsed: false,
    });
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => screen.getByText('Button.tsx'));

    expect(screen.getByText('Button.test.tsx')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Button.test.tsx/i }));
    await waitFor(() => {
      expect(screen.getByText('describe("Button", () => {})')).toBeInTheDocument();
    });
  });

  it('loads entry from history panel and restores form state', async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    // generate first to create history entry
    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => screen.getByText('Button.tsx'));

    // open history
    await user.click(screen.getByText(/history \(1\)/i));
    expect(screen.getByText('Recent generations')).toBeInTheDocument();

    // click the history entry — it's a button inside the list
    const historyList = screen.getByRole('list');
    const historyEntry = historyList.querySelector('button');
    expect(historyEntry).toBeTruthy();
    await user.click(historyEntry!);

    // history panel should close and form should be restored
    await waitFor(() => {
      expect(screen.queryByText('Recent generations')).not.toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/button, card, modal/i)).toHaveValue('button');
  });

  it('clears history when clear button clicked', async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => screen.getByText('Button.tsx'));

    // open history
    await user.click(screen.getByText(/history \(1\)/i));
    expect(screen.getByText('Recent generations')).toBeInTheDocument();

    // click clear
    await user.click(screen.getByRole('button', { name: /clear/i }));
    await waitFor(() => {
      expect(screen.queryByText(/history/i)).not.toBeInTheDocument();
    });
  });

  it('component library tabs switch selection', async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    const radixBtn = screen.getByRole('button', { name: /^radix$/i });
    await user.click(radixBtn);
    expect(radixBtn).toHaveClass('bg-primary');

    const shadcnBtn = screen.getByRole('button', { name: /^shadcn$/i });
    expect(shadcnBtn).not.toHaveClass('bg-primary');
  });

  it('formatTime shows "just now" for recent timestamps', async () => {
    // Set up localStorage with a recent history entry to trigger formatTime
    const recentEntry = {
      id: 'test-id',
      timestamp: Date.now() - 5000, // 5 seconds ago
      componentType: 'navbar',
      framework: 'react',
      componentLibrary: 'shadcn',
      useLlm: false,
      files: [{ path: 'Navbar.tsx', content: 'export function Navbar() {}', language: 'tsx' }],
    };
    localStorage.setItem('siza:generation-history', JSON.stringify([recentEntry]));

    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    // open history panel
    await user.click(screen.getByText(/history \(1\)/i));
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('formatTime shows "Xm ago" for entries minutes old', async () => {
    const entry = {
      id: 'test-id-2',
      timestamp: Date.now() - 5 * 60_000, // 5 minutes ago
      componentType: 'footer',
      framework: 'vue',
      componentLibrary: 'none',
      useLlm: false,
      files: [{ path: 'Footer.vue', content: '<template></template>', language: 'vue' }],
    };
    localStorage.setItem('siza:generation-history', JSON.stringify([entry]));

    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.click(screen.getByText(/history \(1\)/i));
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('formatTime shows "Xh ago" for entries hours old', async () => {
    const entry = {
      id: 'test-id-3',
      timestamp: Date.now() - 2 * 3_600_000, // 2 hours ago
      componentType: 'sidebar',
      framework: 'svelte',
      componentLibrary: 'headlessui',
      useLlm: false,
      files: [{ path: 'Sidebar.svelte', content: '<script></script>', language: 'svelte' }],
    };
    localStorage.setItem('siza:generation-history', JSON.stringify([entry]));

    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.click(screen.getByText(/history \(1\)/i));
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('formatTime shows locale date for entries over a day old', async () => {
    const oldTimestamp = Date.now() - 2 * 86_400_000; // 2 days ago
    const entry = {
      id: 'test-id-4',
      timestamp: oldTimestamp,
      componentType: 'header',
      framework: 'angular',
      componentLibrary: 'radix',
      useLlm: false,
      files: [{ path: 'Header.ts', content: 'export class Header {}', language: 'ts' }],
    };
    localStorage.setItem('siza:generation-history', JSON.stringify([entry]));

    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.click(screen.getByText(/history \(1\)/i));
    // Should show a date string (toLocaleDateString)
    const expectedDate = new Date(oldTimestamp).toLocaleDateString();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('shows LLM badge in history entry when useLlm is true with model name', async () => {
    const llmEntry = {
      id: 'llm-entry',
      timestamp: Date.now() - 5000,
      componentType: 'card',
      framework: 'react',
      componentLibrary: 'shadcn',
      useLlm: true,
      model: 'llama2',
      files: [{ path: 'Card.tsx', content: 'export function Card() {}', language: 'tsx' }],
    };
    localStorage.setItem('siza:generation-history', JSON.stringify([llmEntry]));

    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.click(screen.getByText(/history \(1\)/i));
    expect(screen.getByText('llama2')).toBeInTheDocument();
  });

  it('shows "LLM" fallback in history entry when useLlm is true but no model', async () => {
    const llmEntry = {
      id: 'llm-entry-2',
      timestamp: Date.now() - 5000,
      componentType: 'modal',
      framework: 'react',
      componentLibrary: 'shadcn',
      useLlm: true,
      model: undefined,
      files: [{ path: 'Modal.tsx', content: 'export function Modal() {}', language: 'tsx' }],
    };
    localStorage.setItem('siza:generation-history', JSON.stringify([llmEntry]));

    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.click(screen.getByText(/history \(1\)/i));
    expect(screen.getByText('LLM')).toBeInTheDocument();
  });

  it('shows LLM badge with model name when LLM was used', async () => {
    (mockDesktop.generate.component as ReturnType<typeof vi.fn>).mockResolvedValue({
      files: [{ path: 'Button.tsx', content: 'export function Button() {}', language: 'tsx' }],
      error: null,
      llmUsed: true,
      model: 'llama2',
    });
    const user = userEvent.setup();
    render(<GeneratePage />);
    await waitFor(() => screen.getByText(/ollama is not running/i));

    await user.type(screen.getByPlaceholderText(/button, card, modal/i), 'button');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText(/LLM · llama2/)).toBeInTheDocument();
    });
  });
});
