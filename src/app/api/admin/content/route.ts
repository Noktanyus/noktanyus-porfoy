/**
 * @file İçerik Yönetimi API Rotası
 * @description Projedeki tüm dinamik içeriklerin (blog, projeler, yetenekler vb.)
 *              Oluşturma, Okuma, Güncelleme ve Silme (CRUD) işlemlerini yöneten ana API rotasıdır.
 *              Bu dosya, kimlik doğrulama, dosya sistemi işlemleri, Next.js önbellek (cache)
 *              yenileme ve yapılan değişiklikleri Git'e commit etme gibi kritik görevleri üstlenir.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { commitContentChange } from "@/lib/git-utils";
import { z } from "zod";
import { env } from "@/lib/env";

function apiError(message: string, status: number = 500, error?: any): NextResponse {
  console.error(`API Hatası (Status: ${status}): ${message}`, error ? { error } : '');
  return NextResponse.json({ error: message }, { status });
}

const contentDir = path.join(process.cwd(), "content");
const publicDir = path.join(process.cwd(), "public");

const ALLOWED_TYPES = ['popups', 'messages', 'skills', 'experiences', 'testimonials', 'home-settings', 'seo-settings', 'blog', 'projects', 'about'];

const contentPostSchema = z.object({
  type: z.enum(ALLOWED_TYPES as [string, ...string[]]),
  slug: z.string().min(1, "Slug boş olamaz."),
  originalSlug: z.string().optional(),
  data: z.union([z.record(z.any()), z.array(z.any())]),
  content: z.string().optional(),
});

function getSafePath(type: string, slug?: string): string | null {
  if (!ALLOWED_TYPES.includes(type)) return null;
  const safeSlug = slug ? path.normalize(slug).replace(/^(\.\.(\/|\\|$))+/, '') : '';
  const isRootFile = ['about.md', 'skills.json', 'experiences.json', 'home-settings.json', 'seo-settings.json'].includes(safeSlug);
  const finalPath = isRootFile ? path.join(contentDir, safeSlug) : (slug ? path.join(contentDir, type, safeSlug) : path.join(contentDir, type));
  if (!finalPath.startsWith(contentDir)) return null;
  return finalPath;
}

function getFileExtension(type: string): string {
  return ['blog', 'projects', 'about'].includes(type) ? '.md' : '.json';
}

function revalidateContentPaths(type: string, slug?: string) {
    console.log(`Önbellek temizleniyor: type=${type}, slug=${slug}`);
    if (type === 'about' || type === 'skills' || type === 'experiences') {
        revalidatePath('/hakkimda');
    } else if (type === 'projects') {
        revalidatePath('/projelerim');
        if (slug) revalidatePath(`/projelerim/${slug}`);
    } else if (type === 'blog') {
        revalidatePath('/blog');
        if (slug) revalidatePath(`/blog/${slug}`);
    }
    revalidatePath('/');
    revalidatePath('/layout');
}

export async function GET(request: NextRequest) {
    const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
    if (!token) return apiError("Yetkisiz erişim.", 401);
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const type = typeParam ? typeParam.split(':')[0] : null;
    const slug = searchParams.get("slug");
    if (!type || !ALLOWED_TYPES.includes(type)) return apiError("Geçersiz 'type' parametresi.", 400);
    if (slug) {
        const fileExtension = getFileExtension(type);
        const slugWithExt = slug.endsWith(fileExtension) ? slug : `${slug}${fileExtension}`;
        const filePath = getSafePath(type, slugWithExt);
        if (!filePath) return apiError("Geçersiz dosya yolu.", 400);
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            if (filePath.endsWith('.json')) return NextResponse.json(JSON.parse(fileContent));
            const { data, content } = matter(fileContent);
            return NextResponse.json({ data, content });
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return apiError("Dosya bulunamadı.", 404);
            return apiError("Sunucu hatası: Dosya okunamadı.", 500);
        }
    }
    const dirPath = getSafePath(type);
    if (!dirPath) return apiError("Geçersiz içerik tipi.", 400);
    const rootFilePath = path.join(contentDir, `${type}.json`);
    try {
        await fs.access(rootFilePath);
        const fileContent = await fs.readFile(rootFilePath, 'utf-8');
        return NextResponse.json(JSON.parse(fileContent));
    } catch (e) {}
    try {
        const files = await fs.readdir(dirPath);
        const contentPromises = files
            .filter(file => file.endsWith('.md') || file.endsWith('.json'))
            .map(async (file) => {
                const filePath = path.join(dirPath, file);
                const fileContent = await fs.readFile(filePath, "utf-8");
                const slug = file.replace(/\.(mdx?|json)$/, '');
                if (file.endsWith('.json')) {
                    const parsedContent = JSON.parse(fileContent);
                    return Array.isArray(parsedContent) ? parsedContent : { slug, ...parsedContent };
                }
                const { data } = matter(fileContent);
                return { slug, title: data.title || file, ...data };
            });
        let finalContent = await Promise.all(contentPromises);
        if (['skills', 'experiences'].includes(type) && finalContent.length === 1 && Array.isArray(finalContent[0])) {
            finalContent = finalContent[0];
        }
        return NextResponse.json(finalContent);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return NextResponse.json([]);
        return apiError("İçerik listesi okunurken hata.", 500);
    }
}

export async function DELETE(request: NextRequest) {
    const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
    if (!token) return apiError("Yetkisiz erişim.", 401);
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const type = typeParam ? typeParam.split(':')[0] : null;
    const slugWithExt = searchParams.get("slug");
    if (!type || !slugWithExt || !ALLOWED_TYPES.includes(type)) return apiError("Geçersiz veya eksik parametreler.", 400);
    const filePath = getSafePath(type, slugWithExt);
    if (!filePath) return apiError("Geçersiz dosya yolu.", 400);
    try {
        await fs.unlink(filePath);
        const cleanSlug = slugWithExt.replace(/\.(mdx?|json)$/, '');
        revalidateContentPaths(type, cleanSlug);
        await commitContentChange({
            action: 'delete',
            fileType: type,
            slug: cleanSlug,
            user: token.email || "Bilinmeyen",
            paths: [filePath]
        });
        return NextResponse.json({ message: "İçerik başarıyla silindi." });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return apiError("Dosya bulunamadı.", 404);
        return apiError("Dosya silinemedi.", 500);
    }
}

export async function POST(request: NextRequest) {
    const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
    if (!token) return apiError("Yetkisiz erişim. Lütfen giriş yapın.", 401);
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return apiError("İstek gövdesi (body) JSON formatında değil veya boş.", 400, e);
    }
    const isBatch = Array.isArray(body);
    const itemsToProcess = isBatch ? body : [body];
    const processedSlugs = new Set<string>();
    const changedFilePaths: string[] = [];

    try {
        for (const item of itemsToProcess) {
            const validation = contentPostSchema.safeParse(item);
            if (!validation.success) {
                const errorMessage = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
                throw new Error(`Geçersiz veri: ${errorMessage}`);
            }
            const { type, slug, originalSlug, data, content } = validation.data;
            const fileExtension = getFileExtension(type);
            const newFileName = slug.endsWith(fileExtension) ? slug : slug + fileExtension;
            const newFilePath = getSafePath(type, newFileName);
            if (!newFilePath) throw new Error(`'${slug}' için geçersiz dosya yolu.`);
            
            changedFilePaths.push(newFilePath);

            const dirPath = path.dirname(newFilePath);
            await fs.mkdir(dirPath, { recursive: true });
            if (originalSlug && slug !== originalSlug) {
                const oldFilePath = getSafePath(type, originalSlug + fileExtension);
                if (oldFilePath) {
                    try { 
                        await fs.unlink(oldFilePath);
                        changedFilePaths.push(oldFilePath);
                    }
                    catch (error: any) { if (error.code !== 'ENOENT') console.error(`Eski dosya silinirken hata: ${oldFilePath}`, error); }
                }
            }
            const fileContent = fileExtension === '.json'
                ? JSON.stringify(data, null, 2)
                : matter.stringify(content || "", data);
            await fs.writeFile(newFilePath, fileContent, "utf-8");
            const cleanSlug = slug.replace(/\.(mdx?|json)$/, '');
            revalidateContentPaths(type, cleanSlug);
            if (originalSlug && slug !== originalSlug) revalidateContentPaths(type, originalSlug);
            processedSlugs.add(cleanSlug);
        }
        await commitContentChange({
            action: 'update',
            fileType: isBatch ? 'toplu' : itemsToProcess[0].type,
            slug: Array.from(processedSlugs).join(', '),
            user: token.email || "Bilinmeyen Kullanıcı",
            paths: changedFilePaths
        });
        return NextResponse.json({ message: "İçerik başarıyla kaydedildi!" });
    } catch (error: any) {
        console.error("İçerik kaydedilirken kritik bir hata oluştu:", error);
        return apiError(error.message || "İçerik kaydedilemedi. Sunucu loglarını kontrol edin.", 500, error);
    }
}