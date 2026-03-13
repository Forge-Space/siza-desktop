export interface DesktopBridge {
  ping: () => Promise<string>;
}

export const CHANNELS = {
  ping: 'app:ping'
} as const;

export function normalizePing(value: unknown): string {
  return typeof value === 'string' ? value : 'unknown';
}
