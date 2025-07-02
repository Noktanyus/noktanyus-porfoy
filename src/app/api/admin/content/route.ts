import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { commitContentChange } from "@/lib/git-utils";
import { z } from "zod";
import { env } from "@/lib/env";

// Hata yanıtlarını standartlaştırmak için yardımcı fonksiyon
function apiError(message: string, status: number = 500) {
  console.error(`API Hatası: ${message} (Status: ${status})`);
  return NextResponse.json({ error: message }, { status });
}

const contentDir = path.join(process.cwd(), "content");
const ALLOWED_TYPES = ['popups', 'messages', 'skills', 'experiences', 'testimonials', 'home-settings', 'seo-settings', 'blog', 'projects', 'about'];

// Gelen POST isteğinin gövdesini doğrulamak için Zod şeması
const contentPostSchema = z.object({
  type: z.enum(ALLOWED_TYPES as [string, ...string[]]),
  slug: z.string().min(1, "Slug boş olamaz."),
  originalSlug: z.string().optional(),
  data: z.record(z.any()), // 'data' nesnesinin herhangi bir anahtar/değer içerebileceğini belirtir
  content: z.string().optional(),
});

function getSafePath(type: string, slug?: string): string | null {
  if (!ALLOWED_TYPES.includes(type)) return null;
  const safeSlug = slug ? path.normalize(slug).replace(/^(\.\.(\/|\\|$))+/, '') : '';
  const finalPath = ['about', 'skills', 'experiences', 'home-settings', 'seo-settings'].includes(type)
    ? path.join(contentDir, safeSlug)
    : (slug ? path.join(contentDir, type, safeSlug) : path.join(contentDir, type));
  if (!finalPath.startsWith(contentDir)) return null;
  return finalPath;
}

function getFileExtension(type: string): string {
  return ['blog', 'projects', 'about'].includes(type) ? '.md' : '.json';
}

function revalidateContentPaths(type: string, slug?: string) {
    if (type === 'about' || type === 'skills' || type === 'experiences') revalidatePath('/hakkimda');
    else if (type === 'projects') {
        revalidatePath('/projelerim');
        if (slug) revalidatePath(`/projelerim/${slug}`);
    } else if (type === 'blog') {
        revalidatePath('/blog');
        if (slug) revalidatePath(`/blog/${slug}`);
    }
    revalidatePath('/');
}

async function listContent(type: string) {
  const dirPath = getSafePath(type);
  if (!dirPath) return apiError("Geçersiz içerik tipi.", 400);

  try {
    const files = await fs.readdir(dirPath);
    const contentPromises = files
      .filter(file => file.endsWith('.md') || file.endsWith('.json'))
      .map(async (file) => {
        const filePath = path.join(dirPath, file);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const slug = file.replace(/\.mdx?|\.json$/, '');
        if (file.endsWith('.json')) return { slug, ...JSON.parse(fileContent) };
        const { data } = matter(fileContent);
        return { slug, title: data.title || file, ...data };
      });
    return NextResponse.json(await Promise.all(contentPromises));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return NextResponse.json([]);
    throw error;
  }
}

async function getContent(type: string, slug: string) {
    const fileName = slug.endsWith(getFileExtension(type)) ? slug : slug + getFileExtension(type);
    const filePath = getSafePath(type, fileName);
    if (!filePath) return apiError("Geçersiz dosya yolu.", 400);

    try {
        const fileContent = await fs.readFile(filePath, "utf-8");
        if (filePath.endsWith('.json')) return NextResponse.json(JSON.parse(fileContent));
        const { data, content } = matter(fileContent);
        return NextResponse.json({ data, content });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return apiError("Dosya bulunamadı.", 404);
        return apiError("Sunucu hatası.", 500);
    }
}

async function deleteContent(type: string, slug: string, user: string) {
    const cleanSlug = slug.replace(/\.mdx?|\.json$/, '');
    const fileExtension = getFileExtension(type);
    const fileName = cleanSlug + fileExtension;
    const filePath = getSafePath(type, fileName);

    if (!filePath) return apiError("Geçersiz dosya yolu.", 400);

    let imageUrlsToDelete: string[] = [];
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        if (fileExtension === '.md') {
            const mdImageUrls = (fileContent.match(/!\[.*?\]\(\/images\/.*?\)/g) || [])
                .map(mdLink => mdLink.match(/\(\/images\/.*?\)/)?.[0].slice(1, -1))
                .filter((url): url is string => !!url);
            imageUrlsToDelete.push(...mdImageUrls);
        } else if (fileExtension === '.json') {
            const jsonData = JSON.parse(fileContent);
            const possibleImageKeys = ['imageUrl', 'thumbnail', 'mainImage'];
            for (const key of possibleImageKeys) {
                if (typeof jsonData[key] === 'string' && jsonData[key].startsWith('/images/')) {
                    imageUrlsToDelete.push(jsonData[key]);
                }
            }
        }
    } catch (readError: any) {
        if (readError.code !== 'ENOENT') {
            console.error(`İçerik dosyası okunurken bir hata oluştu: ${filePath}`, readError);
        }
    }

    for (const imageUrl of imageUrlsToDelete) {
        const imagePath = path.join(process.cwd(), 'public', imageUrl);
        try {
            await fs.unlink(imagePath);
            console.log(`İlişkili görsel silindi: ${imagePath}`);
        } catch (imgError: any) {
            if (imgError.code !== 'ENOENT') {
                console.error(`Görsel silinirken hata (işleme devam ediliyor): ${imagePath}`, imgError);
            }
        }
    }

    try {
        await fs.unlink(filePath);
        revalidateContentPaths(type, cleanSlug);
        await commitContentChange({ action: 'delete', fileType: type, slug: cleanSlug, user });
        return NextResponse.json({ message: "İçerik ve ilişkili görseller başarıyla silindi." });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return apiError("Silinecek dosya bulunamadı.", 404);
        return apiError("Dosya silinemedi.", 500);
    }
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim.", 401);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");
  if (!type) return apiError("'type' parametresi gerekli.", 400);
  if (slug) return getContent(type, slug);
  return listContent(type);
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim.", 401);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");
  if (!type || !slug) return apiError("'type' ve 'slug' parametreleri gerekli.", 400);
  return deleteContent(type, slug, token.email || "Bilinmeyen Kullanıcı");
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim.", 401);

  const body = await request.json();
  const validation = contentPostSchema.safeParse(body);

  if (!validation.success) {
    return apiError(`Geçersiz istek verisi: ${validation.error.flatten().formErrors.join(', ')}`, 400);
  }

  const { type, slug, originalSlug, data, content } = validation.data;

  try {
    const fileExtension = getFileExtension(type);
    const newFileName = slug.endsWith(fileExtension) ? slug : slug + fileExtension;
    const newFilePath = getSafePath(type, newFileName);
    if (!newFilePath) return apiError("Geçersiz dosya yolu belirtildi.", 400);

    const dirPath = path.dirname(newFilePath);
    await fs.mkdir(dirPath, { recursive: true });

    const isUpdating = originalSlug && slug === originalSlug;
    if (!isUpdating) {
      try {
        await fs.access(newFilePath);
        return apiError(`Bu kimliğe ('${slug}') sahip bir içerik zaten mevcut.`, 409);
      } catch (error) {}
    }

    if (originalSlug && slug !== originalSlug) {
      const oldFilePath = getSafePath(type, originalSlug + fileExtension);
      if (oldFilePath) {
        try { await fs.unlink(oldFilePath); } 
        catch (error) { if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') console.error(`Eski dosya silinirken hata: ${oldFilePath}`, error); }
      }
    }

    const fileContent = fileExtension === '.json' ? JSON.stringify(data, null, 2) : matter.stringify(content || "", data);
    await fs.writeFile(newFilePath, fileContent, "utf-8");
    
    const cleanSlug = slug.replace(/\.mdx?|\.json$/, '');
    revalidateContentPaths(type, cleanSlug);
    if (originalSlug && slug !== originalSlug) revalidateContentPaths(type, originalSlug);

    await commitContentChange({
      action: isUpdating || (originalSlug && slug !== originalSlug) ? 'update' : 'create',
      fileType: type,
      slug: cleanSlug,
      user: token.email || "Bilinmeyen Kullanıcı"
    });

    return NextResponse.json({ message: "İçerik başarıyla kaydedildi!" });
  } catch (error) {
    console.error("İçerik kaydedilirken hata oluştu:", error);
    return apiError((error as Error).message || "İçerik kaydedilemedi.", 500);
  }
}
