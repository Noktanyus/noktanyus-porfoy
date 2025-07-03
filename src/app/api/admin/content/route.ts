/**
 * @file İçerik Yönetimi API Rotası (Son Hal)
 * @description Bu API rotası, `contentService`'i kullanarak içerik yönetimi
 *              için CRUD işlemlerini yönetir. Sorumluluğu, HTTP isteklerini
 *              almak, doğrulamak ve servis katmanına yönlendirmektir.
 *              Ayrıca Git commit ve önbellek yenileme işlemlerini tetikler.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "@/lib/env";
import * as contentService from "@/services/contentService";
import { commitContentChange } from "@/lib/git-utils";

function apiError(message: string, status: number = 500, error?: any): NextResponse {
  console.error(`API Hatası (Status: ${status}): ${message}`, error ? { error } : '');
  return NextResponse.json({ error: message }, { status });
}

const ALLOWED_TYPES = ['popups', 'messages', 'skills', 'experiences', 'testimonials', 'home-settings', 'seo-settings', 'blog', 'projects', 'about'];

const contentPostSchema = z.object({
  type: z.enum(ALLOWED_TYPES as [string, ...string[]]),
  slug: z.string().min(1, "Slug boş olamaz."),
  originalSlug: z.string().optional(),
  data: z.any(),
  content: z.string().optional(),
});

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
    const type = searchParams.get("type");
    const slug = searchParams.get("slug");

    if (!type || !ALLOWED_TYPES.includes(type)) {
        return apiError("Geçersiz 'type' parametresi.", 400);
    }

    try {
        if (slug) {
            const { data, content } = await contentService.getContent(type, slug);
            return NextResponse.json({ data, content });
        } else {
            const contentList = await contentService.listContent(type);
            return NextResponse.json(contentList);
        }
    } catch (error: any) {
        if (error.message.includes('bulunamadı')) {
            return apiError(error.message, 404);
        }
        return apiError("Sunucu hatası: İçerik okunamadı.", 500, error);
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

    const itemsToProcess = Array.isArray(body) ? body : [body];
    const processedSlugs = new Set<string>();
    const changedPaths = new Set<string>();

    try {
        for (const item of itemsToProcess) {
            const validation = contentPostSchema.safeParse(item);
            if (!validation.success) {
                const errorMessage = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
                throw new Error(`Geçersiz veri: ${errorMessage}`);
            }
            
            const { type, slug, originalSlug, data, content } = validation.data;

            if (originalSlug && slug !== originalSlug) {
                const deletedPath = await contentService.deleteContent(type, originalSlug);
                changedPaths.add(deletedPath);
            }

            const savedPath = await contentService.saveContent(type, slug, data, content);
            changedPaths.add(savedPath);

            revalidateContentPaths(type, slug);
            if (originalSlug && slug !== originalSlug) {
                revalidateContentPaths(type, originalSlug);
            }
            processedSlugs.add(slug);
        }

        await commitContentChange({
            action: 'update',
            fileType: itemsToProcess.length > 1 ? 'toplu' : itemsToProcess[0].type,
            slug: Array.from(processedSlugs).join(', '),
            user: token.email || "Bilinmeyen Kullanıcı",
            paths: Array.from(changedPaths)
        });

        return NextResponse.json({ message: "İçerik başarıyla kaydedildi!" });
    } catch (error: any) {
        return apiError(error.message || "İçerik kaydedilemedi.", 500, error);
    }
}

export async function DELETE(request: NextRequest) {
    const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
    if (!token) return apiError("Yetkisiz erişim.", 401);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    let slug = searchParams.get("slug");

    if (!type || !slug || !ALLOWED_TYPES.includes(type)) {
        return apiError("Geçersiz veya eksik parametreler.", 400);
    }

    try {
        // Olası çift uzantı sorununu temizle (.md.md -> .md)
        slug = slug.replace(/\.(md|json)\.(md|json)$/, `.$1`);

        const deletedPath = await contentService.deleteContent(type, slug);
        
        const cleanSlug = slug.replace(/\.(md|json)$/, '');
        revalidateContentPaths(type, cleanSlug);

        await commitContentChange({
            action: 'delete',
            fileType: type,
            slug: cleanSlug,
            user: token.email || "Bilinmeyen",
            paths: [deletedPath]
        });

        return NextResponse.json({ message: "İçerik başarıyla silindi." });
    } catch (error: any) {
        return apiError("Dosya silinemedi.", 500, error);
    }
}