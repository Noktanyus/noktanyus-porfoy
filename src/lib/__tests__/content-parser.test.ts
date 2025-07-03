// src/lib/__tests__/content-parser.test.ts

import fs from 'fs';
import { getSortedContentData } from '../content-parser';
import matter from 'gray-matter';

// fs ve gray-matter modüllerini taklit et
jest.mock('fs');
jest.mock('gray-matter');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedMatter = matter as jest.Mocked<typeof matter>;

describe('Content Parser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSortedContentData', () => {
    it('should read markdown files and sort them by date (newest first)', () => {
      // Hazırlık
      const mockFiles = ['post2.md', 'post1.md'];
      const mockPost1Content = 'content for post 1';
      const mockPost2Content = 'content for post 2';
      
      // readdirSync'in sahte dosya listesini döndürmesini sağla
      mockedFs.readdirSync.mockReturnValue(mockFiles as any);
      // existsSync'in her zaman true döndürmesini sağla
      mockedFs.existsSync.mockReturnValue(true);
      
      // readFileSync, dosya adına göre farklı içerik döndürecek
      mockedFs.readFileSync.mockImplementation((path) => {
        if ((path as string).includes('post1.md')) return mockPost1Content;
        if ((path as string).includes('post2.md')) return mockPost2Content;
        return '';
      });

      // matter, dosya içeriğine göre farklı metadata döndürecek
      (mockedMatter as any).mockImplementation((content: string) => {
        if (content === mockPost1Content) {
          return { data: { title: 'Post 1', date: '2023-01-01' } };
        }
        if (content === mockPost2Content) {
          return { data: { title: 'Post 2', date: '2023-01-02' } };
        }
        return { data: {} };
      });

      // Eylem
      const result = getSortedContentData('blog');

      // Doğrulama
      expect(result.length).toBe(2);
      // Tarihi yeni olan (post2) ilk sırada olmalı
      expect(result[0].id).toBe('post2');
      expect(result[1].id).toBe('post1');
    });
  });
});