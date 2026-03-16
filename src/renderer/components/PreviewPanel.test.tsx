import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PreviewPanel from './PreviewPanel';
import type { GeneratedFile } from '../../shared/bridge';

const reactFile: GeneratedFile = {
  path: 'Button.tsx',
  content: 'export default function Button() { return <button>Click me</button>; }',
};

const vueFile: GeneratedFile = {
  path: 'Button.vue',
  content: '<template><button>Vue btn</button></template>',
};

const svelteFile: GeneratedFile = {
  path: 'Button.svelte',
  content: '<button>Svelte btn</button>',
};

const angularFile: GeneratedFile = {
  path: 'button.component.ts',
  content: 'export class ButtonComponent {}',
};

describe('PreviewPanel', () => {
  it('shows placeholder when no files', () => {
    render(<PreviewPanel files={[]} framework="react" />);
    expect(screen.getByText(/generate a component to see a preview/i)).toBeInTheDocument();
  });

  it('renders an iframe for react files', () => {
    const { container } = render(<PreviewPanel files={[reactFile]} framework="react" />);
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.title).toBe('Component Preview');
  });

  it('iframe has sandbox=allow-scripts for react', () => {
    const { container } = render(<PreviewPanel files={[reactFile]} framework="react" />);
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts');
  });

  it('renders iframe for vue files', () => {
    const { container } = render(<PreviewPanel files={[vueFile]} framework="vue" />);
    expect(container.querySelector('iframe')).toBeInTheDocument();
  });

  it('renders iframe for svelte files', () => {
    const { container } = render(<PreviewPanel files={[svelteFile]} framework="svelte" />);
    expect(container.querySelector('iframe')).toBeInTheDocument();
  });

  it('renders iframe for angular files', () => {
    const { container } = render(<PreviewPanel files={[angularFile]} framework="angular" />);
    expect(container.querySelector('iframe')).toBeInTheDocument();
  });

  it('srcDoc contains the file content for vue', () => {
    const { container } = render(<PreviewPanel files={[vueFile]} framework="vue" />);
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('srcdoc') ?? '').toContain('Vue btn');
  });

  it('srcDoc contains the file content for react', () => {
    const { container } = render(<PreviewPanel files={[reactFile]} framework="react" />);
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('srcdoc') ?? '').toContain('Click me');
  });

  it('shows placeholder when files array is empty even with framework set', () => {
    render(<PreviewPanel files={[]} framework="vue" />);
    expect(screen.getByText(/generate a component to see a preview/i)).toBeInTheDocument();
  });
});
