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
});
