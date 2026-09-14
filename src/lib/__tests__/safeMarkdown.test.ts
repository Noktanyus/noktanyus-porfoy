import { describe, it, expect } from 'vitest';
import { renderSafeMarkdown, sanitizeRawHtml } from '../safeMarkdown';

describe('safeMarkdown helper', () => {
  describe('renderSafeMarkdown', () => {
    it('returns empty string for null or undefined input', () => {
      expect(renderSafeMarkdown(null)).toBe('');
      expect(renderSafeMarkdown(undefined)).toBe('');
      expect(renderSafeMarkdown('')).toBe('');
    });

    it('renders basic markdown to safe HTML', () => {
      const md = '# Başlık\n\nBu bir **kalın** metin.';
      const html = renderSafeMarkdown(md);
      expect(html).toContain('<h1>Başlık</h1>');
      expect(html).toContain('<strong>kalın</strong>');
    });

    it('strips dangerous scripts and malicious XSS vectors', () => {
      const xssMd = 'Güvenli metin <script>alert("hacked")</script> ve <img src="x" onerror="alert(1)">';
      const html = renderSafeMarkdown(xssMd);
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('onerror');
      expect(html).toContain('Güvenli metin');
    });

    it('preserves safe links and adds rel="noopener noreferrer"', () => {
      const linkMd = '[Noktanyus](https://noktanyus.com)';
      const html = renderSafeMarkdown(linkMd);
      expect(html).toContain('href="https://noktanyus.com"');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('strips javascript: pseudo-protocol in links', () => {
      const maliciousLink = '[Zararlı Link](javascript:alert("XSS"))';
      const html = renderSafeMarkdown(maliciousLink);
      expect(html).not.toContain('href="javascript');
    });
  });

  describe('sanitizeRawHtml', () => {
    it('returns empty string for null or undefined input', () => {
      expect(sanitizeRawHtml(null)).toBe('');
      expect(sanitizeRawHtml(undefined)).toBe('');
      expect(sanitizeRawHtml('')).toBe('');
    });

    it('sanitizes unsafe HTML while preserving allowed tags', () => {
      const raw = '<p>Paragraf <span class="highlight">vurgulu</span></p><script>evil()</script>';
      const sanitized = sanitizeRawHtml(raw);
      expect(sanitized).toContain('<p>Paragraf <span class="highlight">vurgulu</span></p>');
      expect(sanitized).not.toContain('<script>');
    });
  });
});
