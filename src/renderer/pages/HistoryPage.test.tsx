import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import HistoryPage from './HistoryPage';

const STORAGE_KEY = 'siza:generation-history';

const mockEntry = {
  id: 'abc123',
  timestamp: Date.now() - 60_000,
  componentType: 'Button',
  framework: 'react',
  componentLibrary: 'shadcn',
  useLlm: false,
  files: [{ path: 'Button.tsx', content: 'export const Button = () => <button />', language: 'tsx' }],
};

const mockLlmEntry = {
  id: 'def456',
  timestamp: Date.now() - 120_000,
  componentType: 'Card',
  framework: 'vue',
  componentLibrary: 'none',
  useLlm: true,
  model: 'llama3',
  files: [{ path: 'Card.vue', content: '<template><div>Card</div></template>', language: 'vue' }],
};

function renderInRouter(initialPath = '/history') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/generate" element={<div data-testid="generate-page">Generate</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows empty state when no history', () => {
    renderInRouter();
    expect(screen.getByText(/no generation history/i)).toBeInTheDocument();
  });

  it('navigates to generate when "Go to Generate" clicked from empty state', async () => {
    const user = userEvent.setup();
    renderInRouter();

    await user.click(screen.getByText(/go to generate/i));
    await waitFor(() => {
      expect(screen.getByTestId('generate-page')).toBeInTheDocument();
    });
  });

  it('renders history entries', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry]));
    renderInRouter();

    expect(screen.getByText('Button')).toBeInTheDocument();
    expect(screen.getAllByText('react').length).toBeGreaterThan(0);
    expect(screen.getByText('shadcn')).toBeInTheDocument();
  });

  it('shows total count in header', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry, mockLlmEntry]));
    renderInRouter();

    expect(screen.getByText(/2 generations stored/i)).toBeInTheDocument();
  });

  it('shows LLM badge with model when useLlm is true', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockLlmEntry]));
    renderInRouter();

    expect(screen.getByText(/LLM · llama3/i)).toBeInTheDocument();
  });

  it('shows LLM badge without model when model is undefined', () => {
    const noModelLlm = { ...mockLlmEntry, model: undefined };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([noModelLlm]));
    renderInRouter();

    expect(screen.getByText('LLM')).toBeInTheDocument();
  });

  it('hides componentLibrary badge when value is "none"', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockLlmEntry]));
    renderInRouter();

    expect(screen.queryByText('none')).not.toBeInTheDocument();
  });

  it('filters entries by search term', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry, mockLlmEntry]));
    renderInRouter();

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Button');

    expect(screen.getByText('Button')).toBeInTheDocument();
    expect(screen.queryByText('Card')).not.toBeInTheDocument();
  });

  it('clears search with X button', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry, mockLlmEntry]));
    renderInRouter();

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Button');
    expect(screen.queryByText('Card')).not.toBeInTheDocument();

    const clearBtn = searchInput.parentElement!.querySelector('button')!;
    await user.click(clearBtn);
    expect(screen.getByText('Card')).toBeInTheDocument();
  });

  it('filters entries by framework selector', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry, mockLlmEntry]));
    renderInRouter();

    const frameworkSelect = screen.getByRole('combobox');
    await user.selectOptions(frameworkSelect, 'vue');

    expect(screen.queryByText('Button')).not.toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
  });

  it('shows no-results message when filters match nothing', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry]));
    renderInRouter();

    await user.type(screen.getByPlaceholderText(/search/i), 'zzznomatch');
    expect(screen.getByText(/no results match/i)).toBeInTheDocument();
  });

  it('clears filters from no-results message', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry]));
    renderInRouter();

    await user.type(screen.getByPlaceholderText(/search/i), 'zzz');
    await user.click(screen.getByText(/clear filters/i));
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('selects entry on click and shows file tabs', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry]));
    renderInRouter();

    const card = screen.getByRole('button', { name: /button/i });
    await user.click(card);

    await waitFor(() => {
      expect(screen.getByText('Button.tsx')).toBeInTheDocument();
    });
    expect(screen.getByText(/export const Button/)).toBeInTheDocument();
  });

  it('shows placeholder when no entry selected', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry]));
    renderInRouter();

    expect(screen.getByText(/select an entry to view its code/i)).toBeInTheDocument();
  });

  it('deselects entry on second click', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry]));
    renderInRouter();

    const card = screen.getByRole('button', { name: /button/i });
    await user.click(card);
    await waitFor(() => expect(screen.getByText('Button.tsx')).toBeInTheDocument());

    await user.click(card);
    await waitFor(() => {
      expect(screen.queryByText('Button.tsx')).not.toBeInTheDocument();
    });
  });

  it('navigates to /generate with rerun state on Re-run button click', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry]));
    renderInRouter();

    const rerunBtn = screen.getByTitle('Re-run');
    await user.click(rerunBtn);

    await waitFor(() => {
      expect(screen.getByTestId('generate-page')).toBeInTheDocument();
    });
  });

  it('re-runs from detail panel Re-run button', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry]));
    renderInRouter();

    const card = screen.getByRole('button', { name: /button/i });
    await user.click(card);

    await waitFor(() => expect(screen.getByText('Button.tsx')).toBeInTheDocument());

    const rerunBtns = screen.getAllByText('Re-run');
    await user.click(rerunBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId('generate-page')).toBeInTheDocument();
    });
  });

  it('clears all history on Clear all button', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry]));
    renderInRouter();

    await user.click(screen.getByTitle(/clear all/i));
    expect(screen.getByText(/no generation history/i)).toBeInTheDocument();
  });

  it('switches file tab when multiple files', async () => {
    const user = userEvent.setup();
    const multiFileEntry = {
      ...mockEntry,
      files: [
        { path: 'Button.tsx', content: 'export const Button = () => <button />', language: 'tsx' },
        { path: 'index.ts', content: "export { Button } from './Button'", language: 'ts' },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([multiFileEntry]));
    renderInRouter();

    const card = screen.getByRole('button', { name: /button/i });
    await user.click(card);

    await waitFor(() => expect(screen.getByText('Button.tsx')).toBeInTheDocument());

    await user.click(screen.getByText('index.ts'));
    expect(screen.getByText(/export \{ Button \}/)).toBeInTheDocument();
  });

  it('selects entry with Enter key', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockEntry]));
    renderInRouter();

    const card = screen.getByRole('button', { name: /button/i });
    card.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Button.tsx')).toBeInTheDocument();
    });
  });

  it('shows Xh ago for entries 2 hours old', () => {
    const twoHoursAgo = Date.now() - 2 * 3_600_000 - 60_000;
    const entry = { ...mockEntry, timestamp: twoHoursAgo };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry]));
    renderInRouter();
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('shows locale date for entries over 1 day old', () => {
    const twoDaysAgo = Date.now() - 2 * 86_400_000;
    const entry = { ...mockEntry, timestamp: twoDaysAgo };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry]));
    renderInRouter();
    const expectedDate = new Date(twoDaysAgo).toLocaleDateString();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });
});
