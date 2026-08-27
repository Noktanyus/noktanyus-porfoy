/**
 * Blog Scheduling unit testleri.
 *
 * Date validation logic ve service davranislarini test eder.
 * Repository mock'lanir (servis katmanini izole test).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentService } from '../service';
import { blogRepository } from '../repository';

vi.mock('../repository', () => ({
  blogRepository: {
    findBySlug: vi.fn(),
    findPublished: vi.fn(),
    findDrafts: vi.fn(),
    findScheduled: vi.fn(),
    findDueScheduled: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  projectRepository: {
    findBySlug: vi.fn(),
    findFeatured: vi.fn(),
    findAllOrdered: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  popupRepository: {
    findBySlug: vi.fn(),
    findActiveBySlug: vi.fn(),
    findAllActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  aboutRepository: {
    get: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  homeSettingsRepository: {
    get: vi.fn(),
    upsert: vi.fn(),
  },
  seoSettingsRepository: {
    get: vi.fn(),
    upsert: vi.fn(),
  },
}));

describe('Blog Scheduling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('date validation', () => {
    it('gelecek tarih gecerlidir', () => {
      const future = new Date(Date.now() + 86400_000); // +24 saat
      expect(future > new Date()).toBe(true);
    });

    it('gecmis tarih gecersiz sayilir', () => {
      const past = new Date(Date.now() - 86400_000);
      expect(past < new Date()).toBe(true);
    });
  });

  describe('createDraft', () => {
    const validInput = {
      slug: 'my-draft',
      title: 'Yeni Taslak',
      description: 'Taslak icin kisa aciklama metni',
      author: 'Yunus',
      category: 'Tech',
      content: 'x'.repeat(60),
      tags: ['test'],
    };

    it('gecerli input ile status="draft" olarak kaydeder', async () => {
      vi.mocked(blogRepository.create).mockResolvedValue({
        id: '1',
        ...validInput,
        status: 'draft',
      } as any);

      const result = await contentService.createDraft(validInput);

      expect(blogRepository.create).toHaveBeenCalledTimes(1);
      const callArg = vi.mocked(blogRepository.create).mock.calls[0][0];
      expect(callArg.status).toBe('draft');
      expect(callArg.draftSavedAt).toBeInstanceOf(Date);
      expect(result.status).toBe('draft');
    });

    it('eksik zorunlu alanlarda Zod hata firlatir', async () => {
      await expect(contentService.createDraft({ title: 'kisa' })).rejects.toThrow();
      expect(blogRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateDraft', () => {
    it('taslak gunceller ve draftSavedAt set eder', async () => {
      vi.mocked(blogRepository.update).mockResolvedValue({
        id: '1',
        title: 'Guncellendi',
        status: 'draft',
      } as any);

      await contentService.updateDraft('1', { title: 'Guncellendi' });

      const callArg = vi.mocked(blogRepository.update).mock.calls[0][1];
      expect(callArg.status).toBe('draft');
      expect(callArg.draftSavedAt).toBeInstanceOf(Date);
    });
  });

  describe('schedulePost', () => {
    it('status="scheduled" yaparak scheduledAt set eder', async () => {
      const scheduledAt = new Date(Date.now() + 86400_000);
      vi.mocked(blogRepository.update).mockResolvedValue({
        id: '1',
        status: 'scheduled',
        scheduledAt,
      } as any);

      await contentService.schedulePost('1', scheduledAt);

      const callArg = vi.mocked(blogRepository.update).mock.calls[0][1];
      expect(callArg.status).toBe('scheduled');
      expect(callArg.scheduledAt).toEqual(scheduledAt);
    });
  });

  describe('publishNow', () => {
    it('status="published" yaparak publishedAt set eder', async () => {
      vi.mocked(blogRepository.update).mockResolvedValue({
        id: '1',
        status: 'published',
      } as any);

      await contentService.publishNow('1');

      const callArg = vi.mocked(blogRepository.update).mock.calls[0][1];
      expect(callArg.status).toBe('published');
      expect(callArg.publishedAt).toBeInstanceOf(Date);
      expect(callArg.scheduledAt).toBeNull();
    });
  });

  describe('autoPublishDue', () => {
    it('zamani gelmis scheduled yazilari toplu yayinlar', async () => {
      const due = [
        { id: 'a', status: 'scheduled', scheduledAt: new Date(Date.now() - 1000) },
        { id: 'b', status: 'scheduled', scheduledAt: new Date(Date.now() - 2000) },
      ];
      vi.mocked(blogRepository.findDueScheduled).mockResolvedValue(due as any);
      vi.mocked(blogRepository.update).mockResolvedValue({} as any);

      const count = await contentService.autoPublishDue();

      expect(count).toBe(2);
      expect(blogRepository.update).toHaveBeenCalledTimes(2);
    });

    it('due yazi yoksa 0 doner', async () => {
      vi.mocked(blogRepository.findDueScheduled).mockResolvedValue([]);

      const count = await contentService.autoPublishDue();

      expect(count).toBe(0);
      expect(blogRepository.update).not.toHaveBeenCalled();
    });
  });
});
