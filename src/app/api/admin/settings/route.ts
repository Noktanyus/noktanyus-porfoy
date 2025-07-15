import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { env } from '@/lib/env';
import * as contentService from '@/services/contentService';
import { revalidatePath } from 'next/cache';
import { z, ZodError } from 'zod';
import fs from 'fs/promises';
import path from 'path';

// Zod şemaları ile veri doğrulama
const homeSettingsSchema = z.object({
  featuredContentType: z.string(),
  youtubeUrl: z.string().url({ message: "Geçersiz YouTube URL'si." }).optional().or(z.literal('')),
  textTitle: z.string().optional(),
  textContent: z.string().optional(),
  customHtml: z.string().optional(),
});

const seoSettingsSchema = z.object({
    siteTitle: z.string().min(1, "Site başlığı boş olamaz."),
    siteDescription: z.string().min(1, "Site açıklaması boş olamaz."),
    siteKeywords: z.array(z.string()).optional(),
    canonicalUrl: z.string().url({ message: "Geçersiz Canonical URL." }),
    robots: z.string().min(1, "Robots içeriği boş olamaz."),
    favicon: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
    ogType: z.string().optional(),
    ogUrl: z.string().optional(),
    ogSiteName: z.string().optional(),
    twitterCard: z.string().optional(),
    twitterSite: z.string().optional(),
    twitterCreator: z.string().optional(),
    twitterTitle: z.string().optional(),
    twitterDescription: z.string().optional(),
    twitterImage: z.string().optional(),
}).passthrough(); // Bilinmeyen alanlara izin ver

// robotsTxt alanını da içeren yeni bir şema
const seoPostDataSchema = seoSettingsSchema.extend({
  robotsTxt: z.string().optional(),
});

const settingsPostSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("home"), data: homeSettingsSchema }),
  z.object({ type: z.literal("seo"), data: seoPostDataSchema }),
]);

/**
 * API için standart bir hata yanıtı oluşturur ve loglar.
 */
function apiError(message: string, status: number = 500, error?: any): NextResponse {
  console.error(`API Hatası (Ayar): ${message}`, error ? { HataDetayı: error } : '');
  return NextResponse.json({ error: message }, { status });
}

import { withAdminAuth } from '@/lib/auth-utils';

async function getSettingsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type !== 'home' && type !== 'seo') {
    return apiError("Geçersiz 'type' parametresi. Sadece 'home' veya 'seo' olabilir.", 400);
  }

  try {
    const data = type === 'home'
      ? await contentService.getHomeSettings()
      : await contentService.getSeoSettings();
    return NextResponse.json(data);
  } catch (error: any) {
    return apiError(`Ayarlar alınırken bir hata oluştu: ${error.message}`, 500, error);
  }
}

async function postSettingsHandler(request: NextRequest) {
  let body;
  try {
      body = await request.json();
  } catch (e) {
      return apiError("İstek gövdesi (body) hatalı veya boş.", 400, e);
  }

  const validation = settingsPostSchema.safeParse(body);
  if (!validation.success) {
    const zodError = validation.error as ZodError;
    const errorMessage = zodError.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
    return apiError(`Veri doğrulama hatası: ${errorMessage}`, 400, zodError.format());
  }

  const { type, data } = validation.data;

  try {
    if (type === 'home') {
      const homeData = {
        featuredContentType: data.featuredContentType,
        youtubeUrl: data.youtubeUrl || null,
        textTitle: data.textTitle ?? null,
        textContent: data.textContent ?? null,
        customHtml: data.customHtml ?? null,
      };
      await contentService.saveHomeSettings(homeData);
      revalidatePath('/');
    } else { // type === 'seo'
      // robotsTxt verisini ayır
      const { robotsTxt, ...seoDataForDb } = data;

      // robots.txt dosyasını güncelle
      if (typeof robotsTxt === 'string') {
        const filePath = path.join(process.cwd(), "public", "robots.txt");
        await fs.writeFile(filePath, robotsTxt, "utf-8");
      }

      // Kalan veriyi veritabanına kaydet
      const finalSeoData = {
        ...seoDataForDb,
        siteKeywords: seoDataForDb.siteKeywords ?? [],
        favicon: seoDataForDb.favicon ?? null,
        ogTitle: seoDataForDb.ogTitle ?? null,
        ogDescription: seoDataForDb.ogDescription ?? null,
        ogImage: seoDataForDb.ogImage ?? null,
        ogType: seoDataForDb.ogType ?? null,
        ogUrl: seoDataForDb.ogUrl ?? null,
        ogSiteName: seoDataForDb.ogSiteName ?? null,
        twitterCard: seoDataForDb.twitterCard ?? null,
        twitterSite: seoDataForDb.twitterSite ?? null,
        twitterCreator: seoDataForDb.twitterCreator ?? null,
        twitterTitle: seoDataForDb.twitterTitle ?? null,
        twitterDescription: seoDataForDb.twitterDescription ?? null,
        twitterImage: seoDataForDb.twitterImage ?? null,
      };
      await contentService.saveSeoSettings(finalSeoData);
      revalidatePath('/', 'layout');
    }
    return NextResponse.json({ message: `${type === 'home' ? 'Ana sayfa' : 'SEO'} ayarları başarıyla kaydedildi.` });
  } catch (error: any) {
    return apiError(`Ayarlar kaydedilirken bir hata oluştu: ${error.message}`, 500, error);
  }
}

export const GET = withAdminAuth(getSettingsHandler);
export const POST = withAdminAuth(postSettingsHandler);
