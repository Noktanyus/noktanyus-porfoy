// src/services/__tests__/contentService.test.ts

import { promises as fs } from 'fs';
import { getContent, saveContent } from '../contentService';
import matter from 'gray-matter';

// fs modülünü taklit et
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    access: jest.fn(), // access fonksiyonunu da taklit et
    unlink: jest.fn(),
  },
}));

jest.mock('gray-matter');

// Taklit edilen fonksiyonları daha kolay erişim için değişkenlere ata
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedMatter = matter as jest.Mocked<typeof matter>;

describe('ContentService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getContent', () => {
    it('should read and parse a markdown file correctly', async () => {
      const mockFileContent = '---\ntitle: Test Başlık\n---\n\nBu bir test içeriğidir.';
      const mockData = { title: 'Test Başlık' };
      const mockContent = 'Bu bir test içeriğidir.';
      
      mockedFs.access.mockResolvedValue(undefined); // Dosya var
      mockedFs.readFile.mockResolvedValue(mockFileContent);
      (mockedMatter as any).mockReturnValue({ data: mockData, content: mockContent });

      const result = await getContent('blog', 'test-post.md');

      expect(mockedFs.access).toHaveBeenCalledWith(expect.stringContaining('test-post.md'));
      expect(mockedFs.readFile).toHaveBeenCalledWith(expect.stringContaining('test-post.md'), 'utf8');
      expect(mockedMatter).toHaveBeenCalledWith(mockFileContent);
      expect(result.data).toEqual(mockData);
      expect(result.content).toBe(mockContent);
    });

    it('should throw an error if file does not exist', async () => {
      mockedFs.access.mockRejectedValue(new Error('ENOENT')); // Dosya yok

      await expect(getContent('blog', 'non-existent-post.md')).rejects.toThrow(
        "'non-existent-post.md' adlı içerik bulunamadı."
      );
    });
  });

  describe('saveContent', () => {
    it('should write a markdown file correctly', async () => {
      const mockData = { title: 'Yeni Başlık' };
      const mockContent = 'Yeni içerik.';
      const mockFileContent = 'mocked stringified content';

      mockedFs.access.mockResolvedValue(undefined); // Dizin var
      (mockedMatter.stringify as jest.Mock).mockReturnValue(mockFileContent);
      mockedFs.writeFile.mockResolvedValue(undefined);

      await saveContent('projects', 'yeni-proje.md', mockData, mockContent);

      expect(mockedMatter.stringify).toHaveBeenCalledWith(mockContent, mockData);
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('yeni-proje.md'),
        mockFileContent,
        'utf8'
      );
    });

    it('should create directory if it does not exist', async () => {
        mockedFs.access.mockRejectedValue(new Error('ENOENT')); // Dizin yok
        mockedFs.mkdir.mockResolvedValue(undefined);
        mockedFs.writeFile.mockResolvedValue(undefined);
  
        await saveContent('new-type', 'new-file.md', {}, '');
  
        expect(mockedFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('new-type'), { recursive: true });
      });
  });
});
