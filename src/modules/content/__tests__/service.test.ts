import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentService } from '../service';
import { blogRepository, projectRepository, popupRepository } from '../repository';
import { NotFoundError } from '@/modules/shared/errors';

// Repository katmanını mock'la — servis katmanını izole test ediyoruz
vi.mock('../repository', () => ({
  blogRepository: {
    findBySlug: vi.fn(),
    findPublished: vi.fn(),
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

describe('ContentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBlogBySlug', () => {
    it('blog bulunduğunda döner', async () => {
      const mockBlog = {
        id: '1',
        slug: 'test',
        title: 'Test',
        description: 'x',
        author: 'y',
        category: 'z',
        tags: [],
        content: 'x'.repeat(60),
        date: new Date(),
        thumbnail: null,
      };
      vi.mocked(blogRepository.findBySlug).mockResolvedValue(mockBlog as any);

      const result = await contentService.getBlogBySlug('test');
      expect(result).toEqual(mockBlog);
      expect(blogRepository.findBySlug).toHaveBeenCalledWith('test');
    });

    it('blog bulunamadığında NotFoundError fırlatır', async () => {
      vi.mocked(blogRepository.findBySlug).mockResolvedValue(null);

      await expect(contentService.getBlogBySlug('yok')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createBlog', () => {
    const validInput = {
      slug: 'new-post',
      title: 'New Post',
      description: 'A great description about stuff',
      author: 'Yunus',
      category: 'Tech',
      content: 'x'.repeat(60),
      tags: ['test', 'vitest'],
    };

    it('geçersiz input Zod hatası fırlatır', async () => {
      await expect(contentService.createBlog({ title: 'a' })).rejects.toThrow();
      expect(blogRepository.create).not.toHaveBeenCalled();
    });

    it('geçerli input ile blog oluşturur', async () => {
      vi.mocked(blogRepository.create).mockResolvedValue({ id: '1', ...validInput } as any);

      const result = await contentService.createBlog(validInput);
      expect(blogRepository.create).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });
  });

  describe('getProjectBySlug', () => {
    it('proje bulunduğunda döner', async () => {
      const mockProject = { id: '1', slug: 'p1', title: 'P', description: 'd', technologies: ['t'], content: 'c'.repeat(60), order: 0, featured: false, isLive: false, mainImage: null, liveDemo: null, githubRepo: null, date: null };
      vi.mocked(projectRepository.findBySlug).mockResolvedValue(mockProject as any);

      const result = await contentService.getProjectBySlug('p1');
      expect(result).toEqual(mockProject);
    });

    it('proje bulunamadığında NotFoundError fırlatır', async () => {
      vi.mocked(projectRepository.findBySlug).mockResolvedValue(null);
      await expect(contentService.getProjectBySlug('yok')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getActivePopup', () => {
    it('aktif popup döner', async () => {
      const mockPopup = { id: '1', slug: 'p', title: 'T', content: 'C', isActive: true, buttons: [] };
      vi.mocked(popupRepository.findActiveBySlug).mockResolvedValue(mockPopup as any);

      const result = await contentService.getActivePopup('p');
      expect(result).toEqual(mockPopup);
    });

    it('popup bulunamadığında NotFoundError fırlatır', async () => {
      vi.mocked(popupRepository.findActiveBySlug).mockResolvedValue(null);
      await expect(contentService.getActivePopup('yok')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getFeaturedProjects', () => {
    it('repository.findFeatured çağrılır', async () => {
      vi.mocked(projectRepository.findFeatured).mockResolvedValue([]);
      await contentService.getFeaturedProjects();
      expect(projectRepository.findFeatured).toHaveBeenCalled();
    });
  });

  describe('getPublishedBlogs', () => {
    it('ops parametreleri repository.findPublished\'a iletilir', async () => {
      vi.mocked(blogRepository.findPublished).mockResolvedValue([]);
      await contentService.getPublishedBlogs({ category: 'Tech', take: 5 });
      expect(blogRepository.findPublished).toHaveBeenCalledWith({ category: 'Tech', take: 5 });
    });
  });
});