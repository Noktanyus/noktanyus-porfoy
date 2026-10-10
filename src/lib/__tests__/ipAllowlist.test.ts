import { describe, expect, it } from 'vitest';
import { ipAllowed, normalizeClientIp, parseAllowlistInput } from '@/lib/ipAllowlist';

describe('ipAllowlist', () => {
  it('allows all when list empty', () => {
    expect(ipAllowed('1.2.3.4', [])).toBe(true);
  });

  it('matches exact IP', () => {
    expect(ipAllowed('1.2.3.4', ['1.2.3.4'])).toBe(true);
    expect(ipAllowed('1.2.3.5', ['1.2.3.4'])).toBe(false);
  });

  it('matches CIDR', () => {
    expect(ipAllowed('10.1.2.3', ['10.0.0.0/8'])).toBe(true);
    expect(ipAllowed('11.0.0.1', ['10.0.0.0/8'])).toBe(false);
  });

  it('normalizes x-forwarded-for', () => {
    expect(normalizeClientIp('8.8.8.8, 1.1.1.1')).toBe('8.8.8.8');
    expect(normalizeClientIp('::ffff:8.8.8.8')).toBe('8.8.8.8');
  });

  it('parses textarea input', () => {
    expect(parseAllowlistInput('1.1.1.1\n2.2.2.2, 3.3.3.3')).toEqual([
      '1.1.1.1',
      '2.2.2.2',
      '3.3.3.3',
    ]);
  });
});
