/**
 * brandingService — validateCustomDomain + generateBrandCSS için unit testler.
 * (Prisma erişimi gerektiren metodlar ayrı entegrasyon test kapsamında.)
 */

import { describe, it, expect } from 'vitest';
import { brandingService, DEFAULT_BRAND_COLOR } from '../brandingService';

describe('brandingService.validateCustomDomain', () => {
  it('accepts a valid subdomain', () => {
    const r = brandingService.validateCustomDomain('status.example.com');
    expect(r.valid).toBe(true);
  });

  it('accepts a valid apex domain', () => {
    const r = brandingService.validateCustomDomain('example.com');
    expect(r.valid).toBe(true);
  });

  it('rejects empty string', () => {
    const r = brandingService.validateCustomDomain('');
    expect(r.valid).toBe(false);
    expect(r.reason).toBeDefined();
  });

  it('rejects www subdomain', () => {
    const r = brandingService.validateCustomDomain('www.example.com');
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/www/i);
  });

  it('rejects malformed domain (no TLD)', () => {
    const r = brandingService.validateCustomDomain('example');
    expect(r.valid).toBe(false);
  });

  it('rejects domain longer than 253 chars', () => {
    const long = 'a'.repeat(260) + '.com';
    const r = brandingService.validateCustomDomain(long);
    expect(r.valid).toBe(false);
  });

  it('rejects domain with spaces', () => {
    const r = brandingService.validateCustomDomain('bad example.com');
    expect(r.valid).toBe(false);
  });
});

describe('brandingService.generateBrandCSS', () => {
  it('emits --brand-primary variable with the preset color', () => {
    const css = brandingService.generateBrandCSS({
      workspaceId: 'ws-1',
      brandColor: 'blue',
      brandLogo: null,
      brandFavicon: null,
      customDomain: null,
      whiteLabelEnabled: false,
    });
    expect(css).toContain(':root');
    expect(css).toContain('--brand-primary');
    expect(css).toMatch(/#0078D4/i); // blue preset
  });

  it('emits --brand-primary with a custom hex color', () => {
    const css = brandingService.generateBrandCSS({
      workspaceId: 'ws-1',
      brandColor: '#FF00AA',
      brandLogo: null,
      brandFavicon: null,
      customDomain: null,
      whiteLabelEnabled: false,
    });
    expect(css).toContain('#FF00AA');
    expect(css).toContain('--brand-primary');
  });

  it('emits --brand-logo only when whiteLabelEnabled and brandLogo are set', () => {
    const css = brandingService.generateBrandCSS({
      workspaceId: 'ws-1',
      brandColor: 'blue',
      brandLogo: 'https://example.com/logo.svg',
      brandFavicon: null,
      customDomain: null,
      whiteLabelEnabled: true,
    });
    expect(css).toContain('--brand-logo');
    expect(css).toContain('https://example.com/logo.svg');
  });

  it('omits --brand-logo when whiteLabelEnabled is false', () => {
    const css = brandingService.generateBrandCSS({
      workspaceId: 'ws-1',
      brandColor: 'blue',
      brandLogo: 'https://example.com/logo.svg',
      brandFavicon: null,
      customDomain: null,
      whiteLabelEnabled: false,
    });
    expect(css).not.toContain('--brand-logo');
  });

  it('falls back to default color when unknown color key is passed', () => {
    const css = brandingService.generateBrandCSS({
      workspaceId: 'ws-1',
      brandColor: 'unknown',
      brandLogo: null,
      brandFavicon: null,
      customDomain: null,
      whiteLabelEnabled: false,
    });
    expect(css).toContain('--brand-primary');
    expect(css).toContain('#0078D4'); // fallback to blue
  });
});

describe('brandingService presets', () => {
  it('exposes 8 brand color presets', () => {
    expect(Object.keys(brandingService.presets).length).toBeGreaterThanOrEqual(8);
  });

  it('exposes DEFAULT_BRAND_COLOR = "blue"', () => {
    expect(DEFAULT_BRAND_COLOR).toBe('blue');
    expect(brandingService.presets[DEFAULT_BRAND_COLOR]).toBeDefined();
  });
});
