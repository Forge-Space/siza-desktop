import { describe, expect, it } from 'vitest';
import { normalizePing } from './bridge';

describe('normalizePing', () => {
  it('returns string when response is string', () => {
    expect(normalizePing('pong')).toBe('pong');
  });

  it('returns unknown when response is not string', () => {
    expect(normalizePing({ ok: true })).toBe('unknown');
  });
});
