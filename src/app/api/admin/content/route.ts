/**
 * @file İçerik Yönetimi API Rotası
 * @description Bu API rotası, `contentService`'i kullanarak içerik yönetimi
 *              için CRUD işlemlerini yönetir. İstekleri alır, doğrular,
 *              yetkilendirmeyi kontrol eder ve servis katmanına yönlendirir.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { env } from "@/lib/env";
import * as contentService from "@/services/contentService";

/**
 * API için standart bir hata yanıtı oluşturur ve loglar.
 * @param message Kullanıcıya gösterilecek hata mesajı.
 * @param status HTTP durum kodu.
 * @param error Opsiyonel olarak loglanacak orijinal hata nesnesi.
 * @returns NextResponse nesnesi.
 */
function apiError(message: string, status: number = 500, error?: any): NextResponse {
  console.error(`API Hatası (Durum: ${status}): ${message}`, error ? { HataDetayı: error } : '');
  return NextResponse.json({ error: message }, { status });
}

// İzin verilen içerik tiplerini tanımla
const ALLOWED_TYPES = ['popups', 'messages', 'skills', 'experiences', 'testimonials', 'home-settings', 'seo-settings', 'blog', 'projects', 'about'] as const;

// POST isteği için veri doğrulama şeması
const contentPostSchema = z.object({
  type: z.enum(ALLOWED_TYPES),
  slug: z.string().min(1, "Slug alanı boş olamaz."),
  originalSlug: z.string().optional(),
  data: z.any(),
  content: z.string().optional(),
});

/**
 * İlgili yolların önbelleğini temizler.
 * @param type İçerik tipi.
 * @param slug Değiştirilen içeriğin slug'ı.
 */
function revalidateContentPaths(type: (typeof ALLOWED_TYPES)[number], slug?: string) {
    console.log(`Önbellek temizleniyor: tip=${type}, slug=${slug}`);
    const pathsToRevalidate = ['/', '/layout'];
    
    switch (type) {
        case 'about':
        case 'skills':
        case 'experiences':
            pathsToRevalidate.push('/hakkimda');
            break;
        case 'projects':
            pathsToRevalidate.push('/projelerim');
            if (slug) pathsToRevalidate.push(`/projelerim/${slug}`);
            break;
        case 'blog':
            pathsToRevalidate.push('/blog');
            if (slug) pathsToRevalidate.push(`/blog/${slug}`);
            break;
    }
    
    pathsToRevalidate.forEach(path => revalidatePath(path));
}

// --- HTTP Metotları ---

export async function GET(request: NextRequest) {
    const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
    if (!token) return apiError("Yetkisiz erişim.", 401);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const slug = searchParams.get("slug");

    if (!type || !ALLOWED_TYPES.includes(type as any)) {
        return apiError("Geçersiz 'type' parametresi.", 400);
    }

    try {
        const result = slug 
            ? await contentService.getContent(type, slug)
            : await contentService.listContent(type);
        return NextResponse.json(result);
    } catch (error: any) {
        if (error.message.includes('bulunamadı')) {
            return apiError(error.message, 404, error);
        }
        return apiError("Sunucu hatası: İçerik okunurken bir sorun oluştu.", 500, error);
    }
}

export async function POST(request: NextRequest) {
    const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
    if (!token) return apiError("Yetkisiz erişim. Lütfen tekrar giriş yapın.", 401);

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return apiError("İstek gövdesi (body) hatalı veya boş.", 400, e);
    }

    try {
        const validation = contentPostSchema.safeParse(body);
        if (!validation.success) {
            const zodError = validation.error as ZodError;
            const errorMessage = zodError.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
            return apiError(`Veri doğrulama hatası: ${errorMessage}`, 400);
        }
        
        const { type, slug, originalSlug, data, content } = validation.data;

        if (originalSlug && slug !== originalSlug) {
            await contentService.deleteContent(type, originalSlug);
            revalidateContentPaths(type, originalSlug);
        }

        await contentService.saveContent(type, slug, data, content);
        revalidateContentPaths(type, slug);

        return NextResponse.json({ message: "İçerik başarıyla kaydedildi." });
    } catch (error: any) {
        return apiError(error.message || "İçerik kaydedilirken beklenmedik bir hata oluştu.", 500, error);
    }
}

export async function DELETE(request: NextRequest) {
    const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
    if (!token) return apiError("Yetkisiz erişim.", 401);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const slug = searchParams.get("slug");

    if (!type || !slug || !ALLOWED_TYPES.includes(type as any)) {
        return apiError("Geçersiz veya eksik parametreler: 'type' ve 'slug' gereklidir.", 400);
    }

    try {
        await contentService.deleteContent(type, slug);
        revalidateContentPaths(type as any, slug);
        return NextResponse.json({ message: "İçerik başarıyla silindi." });
    } catch (error: any) {
        return apiError("İçerik silinirken bir hata oluştu.", 500, error);
    }
}
