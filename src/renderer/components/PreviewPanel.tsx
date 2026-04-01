import { useMemo } from 'react';
import type { GeneratedFile } from '../../shared/bridge';

interface PreviewPanelProps {
  files: GeneratedFile[];
  framework: string;
}

// Split </script> to avoid confusing the HTML parser when embedded in a string
const CLOSE_SCRIPT = '</scr' + 'ipt>';

function buildHtml(files: GeneratedFile[], framework: string): string {
  const mainFile = files[0];
  if (!mainFile) return '';

  const code = mainFile.content;
  const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (framework === 'vue') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Preview</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js">${CLOSE_SCRIPT}
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    const codeDiv = document.createElement('div');
    codeDiv.style.cssText = 'padding:8px;background:#f5f5f5;border-radius:4px;font-family:monospace;font-size:12px;white-space:pre-wrap';
    codeDiv.textContent = '${code}';
    document.getElementById('app').appendChild(codeDiv);
  ${CLOSE_SCRIPT}
</body>
</html>`;
  }

  if (framework === 'svelte') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Preview</title>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="app">
    <div style="padding:8px;background:#f5f5f5;border-radius:4px;font-family:monospace;font-size:12px;white-space:pre-wrap">${escaped}</div>
  </div>
</body>
</html>`;
  }

  if (framework === 'angular') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Preview</title>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="app">
    <div style="padding:8px;background:#f5f5f5;border-radius:4px;font-family:monospace;font-size:12px;white-space:pre-wrap">${escaped}</div>
  </div>
</body>
</html>`;
  }

  // React (default) — use Babel standalone + React CDN
  const exportMatch = code.match(/export default function (\w+)/);
  const componentName = exportMatch?.[1] ?? 'Component';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js">${CLOSE_SCRIPT}
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js">${CLOSE_SCRIPT}
  <script src="https://unpkg.com/@babel/standalone/babel.min.js">${CLOSE_SCRIPT}
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
${code}

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  const Comp = typeof ${componentName} !== 'undefined' ? ${componentName} : () => React.createElement('div', {
    style: { padding: 8, background: '#f5f5f5', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }
  }, 'Component rendered (no default export found for live preview)');
  root.render(React.createElement(Comp));
} catch(e) {
  const errorDiv = document.createElement('pre');
  errorDiv.style.cssText = 'color:red;padding:8px;margin:0';
  errorDiv.textContent = e instanceof Error ? e.message : String(e);
  document.getElementById('root').appendChild(errorDiv);
}
  ${CLOSE_SCRIPT}
</body>
</html>`;
}

export default function PreviewPanel({ files, framework }: PreviewPanelProps) {
  const srcDoc = useMemo(() => buildHtml(files, framework), [files, framework]);

  if (!files.length) {
    return (
      <div className="flex items-center justify-center h-[480px] rounded-md border border-border bg-muted text-sm text-muted-foreground">
        Generate a component to see a preview
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden" style={{ height: 480 }}>
      <iframe
        title="Component Preview"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="w-full h-full bg-white"
        style={{ border: 'none' }}
      />
    </div>
  );
}
