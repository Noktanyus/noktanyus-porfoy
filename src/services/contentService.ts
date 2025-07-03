/**
 * @file İçerik Servis Katmanı (Sağlamlaştırılmış)
 * @description Bu modül, dosya sistemiyle ilgili tüm içerik yönetimi
 *              iş mantığını merkezileştirir. Boş dosyaları, farklı uzantıları
 *              ve diğer köşe senaryolarını doğru şekilde yönetir.
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content');

const MARKDOWN_TYPES = ['blog', 'projects', 'about'];
const ROOT_CONTENT_FILES = [
    'about.md', 'skills.json', 'experiences.json', 
    'home-settings.json', 'seo-settings.json', 'testimonials.json'
];

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

function getFullPath(type: string, slug: string): string {
    const cleanSlug = slug.replace(/\.(md|json)$/, '');
    const extension = MARKDOWN_TYPES.includes(type) ? '.md' : '.json';
    const finalSlugWithExt = `${cleanSlug}${extension}`;

    const isRootFile = ROOT_CONTENT_FILES.includes(finalSlugWithExt);
    const directory = isRootFile ? contentDirectory : path.join(contentDirectory, type);
    
    return path.join(directory, finalSlugWithExt);
}

export async function getContent(type: string, slug: string): Promise<{data: any, content: string}> {
  const fullPath = getFullPath(type, slug);
  if (!(await fileExists(fullPath))) {
    throw new Error(`'${slug}' adlı içerik bulunamadı.`);
  }
  
  const fileContents = await fs.readFile(fullPath, 'utf8');

  // Boş dosya kontrolü
  if (fileContents.trim() === '') {
    return { data: MARKDOWN_TYPES.includes(type) ? {} : [], content: '' };
  }

  if (fullPath.endsWith('.json')) {
    try {
      return { data: JSON.parse(fileContents), content: '' };
    } catch (e) {
      console.error(`JSON parse hatası: ${fullPath}`, e);
      throw new Error(`'${slug}' adlı JSON dosyası hatalı formatta.`);
    }
  }

  const { data, content } = matter(fileContents);
  return { data, content };
}

export async function listContent(type: string): Promise<any[]> {
    const directory = path.join(contentDirectory, type);
    if (!(await fileExists(directory))) {
        return [];
    }

    const fileNames = await fs.readdir(directory);
    const contentList = await Promise.all(
        fileNames
            .filter(fileName => fileName.endsWith('.md') || fileName.endsWith('.json'))
            .map(async (fileName) => {
                try {
                    const { data } = await getContent(type, fileName);
                    if (Array.isArray(data)) {
                        return data;
                    }
                    const slug = fileName.replace(/\.(mdx?|json)$/, '');
                    return { slug, ...data };
                } catch (error) {
                    console.error(`'${fileName}' listelenirken hata oluştu:`, error);
                    return null; // Hatalı dosyayı atla
                }
            })
    );
    
    const filteredList = contentList.filter(item => item !== null);

    if (filteredList.length === 1 && Array.isArray(filteredList[0])) {
        return filteredList[0];
    }
    return filteredList;
}

export async function saveContent(type: string, slug: string, data: any, content?: string): Promise<string> {
  const fullPath = getFullPath(type, slug);
  const directory = path.dirname(fullPath);

  if (!(await fileExists(directory))) {
    await fs.mkdir(directory, { recursive: true });
  }

  let fileContent: string;
  if (fullPath.endsWith('.json')) {
    fileContent = JSON.stringify(data, null, 2);
  } else {
    fileContent = matter.stringify(content || '', data);
  }

  await fs.writeFile(fullPath, fileContent, 'utf8');
  return fullPath;
}

export async function deleteContent(type: string, slug: string): Promise<string> {
    const fullPath = getFullPath(type, slug);
    try {
        await fs.unlink(fullPath);
    } catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
    }
    return fullPath;
}