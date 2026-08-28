/**
 * A11y Helpers — Unit Tests
 *
 * Test edilenler:
 *   - FOCUS_RING_STYLE / SKIP_TARGET_ID exports
 *   - labelProps / describedByProps / requiredProps / invalidProps
 *   - liveRegionProps / busyProps / expandableProps
 *   - validateA11y: img alt, button label, link label, input label, heading skip
 */

import { describe, it, expect } from 'vitest';
import {
  FOCUS_RING_STYLE,
  SKIP_TARGET_ID,
  SKIP_LINK_LABEL,
  labelProps,
  describedByProps,
  requiredProps,
  invalidProps,
  errorMessageId,
  helperTextId,
  buttonLabel,
  liveRegionProps,
  busyProps,
  expandableProps,
  validateA11y,
} from '../a11y';

describe('constants', () => {
  it('exports focus ring & skip target constants', () => {
    expect(FOCUS_RING_STYLE).toContain('focus-visible:ring-2');
    expect(SKIP_TARGET_ID).toBe('main-content');
    expect(SKIP_LINK_LABEL.length).toBeGreaterThan(0);
  });
});

describe('aria helpers', () => {
  it('labelProps uses fieldId-label', () => {
    expect(labelProps('email')).toEqual({ 'aria-labelledby': 'email-label' });
  });

  it('describedByProps returns empty when no id', () => {
    expect(describedByProps()).toEqual({});
    expect(describedByProps(undefined)).toEqual({});
  });

  it('describedByProps returns aria-describedby when id provided', () => {
    expect(describedByProps('email-helper')).toEqual({ 'aria-describedby': 'email-helper' });
  });

  it('requiredProps / invalidProps produce true/false strings', () => {
    expect(requiredProps(true)).toEqual({ 'aria-required': 'true' });
    expect(requiredProps(false)).toEqual({ 'aria-required': 'false' });
    expect(invalidProps(true)).toEqual({ 'aria-invalid': 'true' });
    expect(invalidProps(false)).toEqual({ 'aria-invalid': 'false' });
  });

  it('errorMessageId / helperTextId format', () => {
    expect(errorMessageId('email')).toBe('email-error');
    expect(helperTextId('email')).toBe('email-helper');
  });

  it('buttonLabel returns empty when text, label when no text', () => {
    expect(buttonLabel('Gönder')).toEqual({});
    expect(buttonLabel(undefined, 'Gönder')).toEqual({ 'aria-label': 'Gönder' });
    expect(buttonLabel()).toEqual({});
  });

  it('liveRegionProps sets politeness + atomic', () => {
    expect(liveRegionProps('polite')).toEqual({ 'aria-live': 'polite', 'aria-atomic': 'true' });
    expect(liveRegionProps('assertive')).toEqual({ 'aria-live': 'assertive', 'aria-atomic': 'true' });
    expect(liveRegionProps('off')).toEqual({ 'aria-live': 'off', 'aria-atomic': 'true' });
  });

  it('busyProps toggles true/false', () => {
    expect(busyProps(true)).toEqual({ 'aria-busy': 'true' });
    expect(busyProps(false)).toEqual({ 'aria-busy': 'false' });
  });

  it('expandableProps handles menu, dialog, listbox, no popup', () => {
    expect(expandableProps(true, 'menu')).toEqual({
      'aria-expanded': 'true',
      'aria-haspopup': 'menu',
    });
    expect(expandableProps(false, 'dialog')).toEqual({
      'aria-expanded': 'false',
      'aria-haspopup': 'dialog',
    });
    expect(expandableProps(true)).toEqual({ 'aria-expanded': 'true' });
  });
});

describe('validateA11y', () => {
  it('returns passed=true for empty / invalid input', () => {
    expect(validateA11y('').passed).toBe(true);
    // @ts-expect-error testing invalid input
    expect(validateA11y(null).passed).toBe(true);
  });

  it('flags img without alt (error)', () => {
    const html = '<div><img src="x.jpg"></div>';
    const r = validateA11y(html);
    expect(r.passed).toBe(false);
    expect(r.errorCount).toBe(1);
    expect(r.issues[0].code).toBe('IMG_MISSING_ALT');
  });

  it('passes img with alt attribute', () => {
    const html = '<div><img src="x.jpg" alt="Profil fotoğrafı"></div>';
    const r = validateA11y(html);
    expect(r.passed).toBe(true);
  });

  it('passes decorative img with role=presentation', () => {
    const html = '<div><img src="bg.jpg" role="presentation" alt=""></div>';
    const r = validateA11y(html);
    expect(r.passed).toBe(true);
  });

  it('flags button without accessible label (error)', () => {
    const html = '<div><button></button></div>';
    const r = validateA11y(html);
    expect(r.passed).toBe(false);
    expect(r.issues.some((i) => i.code === 'BUTTON_NO_LABEL')).toBe(true);
  });

  it('passes button with aria-label', () => {
    const html = '<div><button aria-label="Kapat"><svg></svg></button></div>';
    const r = validateA11y(html);
    expect(r.passed).toBe(true);
  });

  it('passes button with text', () => {
    const html = '<div><button>Gönder</button></div>';
    const r = validateA11y(html);
    expect(r.passed).toBe(true);
  });

  it('flags link without accessible label (error)', () => {
    const html = '<div><a href="/x"></a></div>';
    const r = validateA11y(html);
    expect(r.passed).toBe(false);
    expect(r.issues.some((i) => i.code === 'LINK_NO_LABEL')).toBe(true);
  });

  it('flags heading skip (warning)', () => {
    const html = '<h1>Başlık</h1><h3>Alt başlık</h3>';
    const r = validateA11y(html);
    expect(r.errorCount).toBe(0);
    expect(r.warningCount).toBeGreaterThan(0);
    expect(r.issues.some((i) => i.code === 'HEADING_SKIP')).toBe(true);
  });

  it('flags input without associated label (warning)', () => {
    const html = '<form><input type="text" id="email" /></form>';
    const r = validateA11y(html);
    expect(r.warningCount).toBeGreaterThan(0);
    expect(r.issues.some((i) => i.code === 'INPUT_NO_LABEL')).toBe(true);
  });

  it('passes input with proper label[for]', () => {
    const html = '<form><label for="email">Email</label><input type="email" id="email" /></form>';
    const r = validateA11y(html);
    expect(r.warningCount).toBe(0);
  });

  it('passes input with aria-label', () => {
    const html = '<form><input type="email" id="email" aria-label="E-posta" /></form>';
    const r = validateA11y(html);
    expect(r.warningCount).toBe(0);
  });

  it('skips button/input with hidden type', () => {
    const html =
      '<div><button type="submit"></button><input type="hidden" name="csrf" value="x" /></div>';
    const r = validateA11y(html);
    // Submit buttons typically have accompanying text in real markup; here bare but
    // we'll accept that submit buttons are flagged — only hidden inputs are skipped.
    const submitFlag = r.issues.find((i) => i.code === 'BUTTON_NO_LABEL');
    expect(submitFlag).toBeDefined();
    // No input warning for hidden
    expect(r.issues.some((i) => i.code === 'INPUT_NO_LABEL')).toBe(false);
  });
});