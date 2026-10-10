import { describe, it, expect } from 'vitest';
import {
  STATUS_INCIDENT_CATEGORY,
  STATUS_SUBSCRIBE_SOURCE,
  isStatusIncidentSubscribe,
  statusVerifyEmailCopy,
  statusBadgeMarkdown,
  publicStatusEndpoints,
} from '../statusSubscribe';

describe('statusSubscribe', () => {
  describe('isStatusIncidentSubscribe', () => {
    it('accepts durum / status source', () => {
      expect(isStatusIncidentSubscribe({ source: 'durum' })).toBe(true);
      expect(isStatusIncidentSubscribe({ source: 'STATUS' })).toBe(true);
    });

    it('accepts incidents / status / durum categories', () => {
      expect(
        isStatusIncidentSubscribe({ categories: [STATUS_INCIDENT_CATEGORY] })
      ).toBe(true);
      expect(isStatusIncidentSubscribe({ categories: ['status'] })).toBe(true);
      expect(isStatusIncidentSubscribe({ categories: ['Durum'] })).toBe(true);
    });

    it('rejects blog / footer without status category', () => {
      expect(isStatusIncidentSubscribe({ source: 'footer' })).toBe(false);
      expect(
        isStatusIncidentSubscribe({ source: 'blog', categories: ['Frontend'] })
      ).toBe(false);
      expect(isStatusIncidentSubscribe({})).toBe(false);
    });
  });

  describe('statusVerifyEmailCopy', () => {
    it('returns Turkish incident copy', () => {
      const copy = statusVerifyEmailCopy(true);
      expect(copy.subject).toContain('Kesinti');
      expect(copy.heading).toMatch(/onaylayın/i);
      expect(copy.cta).toMatch(/onayla/i);
    });

    it('returns default blog copy when not incident', () => {
      const copy = statusVerifyEmailCopy(false);
      expect(copy.subject).toContain('Blog');
      expect(copy.cta).toBe('Aboneliği Onayla');
    });
  });

  describe('embed helpers', () => {
    it('builds markdown badge pointing at /durum', () => {
      const md = statusBadgeMarkdown();
      expect(md).toContain('/api/health/badge');
      expect(md).toContain('/durum');
      expect(md.startsWith('[![')).toBe(true);
    });

    it('lists public SVG + JSON endpoints', () => {
      const eps = publicStatusEndpoints('https://noktanyus.com/');
      expect(eps.badgeSvg).toBe('https://noktanyus.com/api/health/badge');
      expect(eps.healthJson).toBe('https://noktanyus.com/api/health');
      expect(eps.durumPage).toBe('https://noktanyus.com/durum');
    });

    it('exports stable source / category constants', () => {
      expect(STATUS_SUBSCRIBE_SOURCE).toBe('durum');
      expect(STATUS_INCIDENT_CATEGORY).toBe('incidents');
    });
  });
});
