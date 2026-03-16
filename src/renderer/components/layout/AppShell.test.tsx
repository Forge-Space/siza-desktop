import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import AppShell from './AppShell';

function renderInRouter(initialPath = '/generate') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={
            <AppShell>
              <div data-testid="content">page content</div>
            </AppShell>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('AppShell', () => {
  it('renders children inside main', () => {
    renderInRouter('/generate');
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('renders nav buttons for Generate, History, Models, and Settings', () => {
    renderInRouter('/generate');
    expect(screen.getByTitle('Generate (⌘G)')).toBeInTheDocument();
    expect(screen.getByTitle('History (⌘H)')).toBeInTheDocument();
    expect(screen.getByTitle('Models (⌘M)')).toBeInTheDocument();
    expect(screen.getByTitle('Settings (⌘,)')).toBeInTheDocument();
  });

  it('highlights Generate nav button when on /generate', () => {
    renderInRouter('/generate');
    const generateBtn = screen.getByTitle('Generate (⌘G)');
    expect(generateBtn).toHaveClass('bg-primary');
    const settingsBtn = screen.getByTitle('Settings (⌘,)');
    expect(settingsBtn).not.toHaveClass('bg-primary');
  });

  it('highlights Settings nav button when on /settings', () => {
    renderInRouter('/settings');
    const settingsBtn = screen.getByTitle('Settings (⌘,)');
    expect(settingsBtn).toHaveClass('bg-primary');
    const generateBtn = screen.getByTitle('Generate (⌘G)');
    expect(generateBtn).not.toHaveClass('bg-primary');
  });

  it('navigates to /generate when Generate button clicked', async () => {
    const user = userEvent.setup();
    renderInRouter('/settings');

    const generateBtn = screen.getByTitle('Generate (⌘G)');
    await user.click(generateBtn);
    // After navigation, Generate button becomes active
    expect(generateBtn).toHaveClass('bg-primary');
  });

  it('navigates to /settings when Settings button clicked', async () => {
    const user = userEvent.setup();
    renderInRouter('/generate');

    const settingsBtn = screen.getByTitle('Settings (⌘,)');
    await user.click(settingsBtn);
    expect(settingsBtn).toHaveClass('bg-primary');
  });

  it('renders app logo icon in sidebar', () => {
    renderInRouter('/generate');
    const aside = screen.getByRole('complementary');
    expect(aside).toBeInTheDocument();
    // Logo wrapper div is in the sidebar
    expect(aside.querySelector('.bg-primary.flex')).toBeInTheDocument();
  });

  it('active nav item has aria-current="page"', () => {
    renderInRouter('/generate');
    const generateBtn = screen.getByTitle('Generate (⌘G)');
    expect(generateBtn).toHaveAttribute('aria-current', 'page');
    const settingsBtn = screen.getByTitle('Settings (⌘,)');
    expect(settingsBtn).not.toHaveAttribute('aria-current', 'page');
  });

  it('nav buttons have accessible names via aria-label', () => {
    renderInRouter('/generate');
    expect(screen.getByRole('button', { name: 'Generate (⌘G)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'History (⌘H)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Models (⌘M)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings (⌘,)' })).toBeInTheDocument();
  });
});
