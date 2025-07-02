/**
 * @file Genel ayar dosyalarını (JSON) yönetmek için API rotası.
 * @description Bu rota, `content` dizinindeki JSON tabanlı ayar dosyalarını
 *              (örn: home-settings.json, seo-settings.json) okuma (GET) ve
 *              yazma (POST) işlemlerini gerçekleştirir. Ayrıca `robots.txt`
 *              dosyasını güncelleme yeteneğine de sahiptir.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { commitContentChange } from "@/lib/git-utils";
import { env } from "@/lib/env";

// Ana içerik ve public dizinlerinin yolları
const contentDir = path.join(process.cwd(), "content");
const publicDir = path.join(process.cwd(), "public");

/**
 * GET isteği: Belirtilen ayar dosyasının içeriğini okur ve döndürür.
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (!file) {
    return NextResponse.json({ error: "'file' parametresi zorunludur." }, { status: 400 });
  }

  try {
    // Güvenlik için dosya yolunun contentDir içinde olduğundan emin ol
    const filePath = path.join(contentDir, file);
    if (!filePath.startsWith(contentDir)) {
        return NextResponse.json({ error: "Geçersiz dosya yolu." }, { status: 400 });
    }
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Ayar dosyası bulunamadı veya okunamadı." }, { status: 404 });
  }
}

/**
 * POST isteği: Belirtilen ayar dosyasını ve isteğe bağlı olarak robots.txt'yi günceller.
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });

  const { file, data, robotsTxt } = await request.json();

  if (!file || !data) {
    return NextResponse.json({ error: "Eksik alanlar: 'file' ve 'data' zorunludur." }, { status: 400 });
  }

  try {
    // JSON ayar dosyasını yaz
    const filePath = path.join(contentDir, file);
    if (!filePath.startsWith(contentDir)) {
        return NextResponse.json({ error: "Geçersiz dosya yolu." }, { status: 400 });
    }
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

    // Eğer robotsTxt içeriği de gönderildiyse, public/robots.txt dosyasını yaz
    if (typeof robotsTxt === 'string') {
      const robotsPath = path.join(publicDir, "robots.txt");
      await fs.writeFile(robotsPath, robotsTxt, "utf-8");
    }

    // Ayar dosyasına göre ilgili yolların önbelleğini temizle
    if (file === 'home-settings.json') {
      revalidatePath('/');
    } else if (file === 'seo-settings.json') {
      revalidatePath('/', 'layout'); // SEO ayarları tüm layout'u etkileyebilir
    }

    // Değişikliği Git'e commit'le
    const changedPaths = [filePath];
    if (typeof robotsTxt === 'string') {
      changedPaths.push(path.join(publicDir, "robots.txt"));
    }

    await commitContentChange({
      action: 'update',
      fileType: 'settings',
      slug: file,
      user: token.email || "Bilinmeyen Kullanıcı",
      paths: changedPaths
    });

    return NextResponse.json({ message: "Ayarlar başarıyla kaydedildi!" });
  } catch (error) {
    console.error("Ayarlar kaydedilirken hata:", error);
    return NextResponse.json({ error: "Ayarlar kaydedilirken bir sunucu hatası oluştu." }, { status: 500 });
  }
}
