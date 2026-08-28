/**
 * User Preferences Service — Unit Tests
 *
 * Test edilenler:
 *   - getPreferences default donusu
 *   - getPreferences existing row'dan okuma
 *   - updatePreferences upsert (create / update)
 *   - type guards ile invalid deger filtreleme
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma'yı mockla
vi.mock('@/lib/prisma', () => ({
  prisma: {
    themePreference: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Logger'ı mockla
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { userPreferencesService } from '../service';

const USER_ID = 'user_test_1';

describe('userPreferencesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('returns defaults when no row exists', async () => {
      (prisma.themePreference.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const prefs = await userPreferencesService.getPreferences(USER_ID);

      expect(prefs).toEqual({ theme: 'system', accentColor: 'blue' });
      expect(prisma.themePreference.findUnique).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        select: { theme: true, accentColor: true },
      });
    });

    it('returns existing values', async () => {
      (prisma.themePreference.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        theme: 'dark',
        accentColor: 'purple',
      });

      const prefs = await userPreferencesService.getPreferences(USER_ID);
      expect(prefs).toEqual({ theme: 'dark', accentColor: 'purple' });
    });

    it('falls back to defaults when DB has invalid values', async () => {
      (prisma.themePreference.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        theme: 'rainbow', // invalid
        accentColor: 'magenta', // invalid
      });

      const prefs = await userPreferencesService.getPreferences(USER_ID);
      expect(prefs).toEqual({ theme: 'system', accentColor: 'blue' });
    });
  });

  describe('updatePreferences', () => {
    it('upserts with only theme change', async () => {
      (prisma.themePreference.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
        theme: 'light',
        accentColor: 'blue',
      });

      const prefs = await userPreferencesService.updatePreferences(USER_ID, { theme: 'light' });

      expect(prefs).toEqual({ theme: 'light', accentColor: 'blue' });
      expect(prisma.themePreference.upsert).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        update: { theme: 'light' },
        create: { userId: USER_ID, theme: 'light', accentColor: 'blue' },
        select: { theme: true, accentColor: true },
      });
    });

    it('upserts with both fields on first create', async () => {
      (prisma.themePreference.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
        theme: 'dark',
        accentColor: 'green',
      });

      await userPreferencesService.updatePreferences(USER_ID, {
        theme: 'dark',
        accentColor: 'green',
      });

      const call = (prisma.themePreference.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.create).toEqual({ userId: USER_ID, theme: 'dark', accentColor: 'green' });
      expect(call.update).toEqual({ theme: 'dark', accentColor: 'green' });
    });

    it('upserts with only accentColor', async () => {
      (prisma.themePreference.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
        theme: 'system',
        accentColor: 'pink',
      });

      await userPreferencesService.updatePreferences(USER_ID, { accentColor: 'pink' });

      const call = (prisma.themePreference.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.update).toEqual({ accentColor: 'pink' });
      expect(call.create).toEqual({ userId: USER_ID, theme: 'system', accentColor: 'pink' });
    });
  });
});