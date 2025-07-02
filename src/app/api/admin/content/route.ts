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
import matter from "gray-matter"; // .md dosyalarındaki front-matter'ı ayrıştırmak için
import { revalidatePath } from "next/cache"; // Değişiklik sonrası Next.js önbelleğini temizlemek için
import { commitContentChange } from "@/lib/git-utils"; // Değişiklikleri Git'e commit'lemek için
import { z } from "zod"; // Gelen verileri doğrulamak için
import { env } from "@/lib/env"; // Ortam değişkenlerini güvenli bir şekilde kullanmak için

/**
 * Standartlaştırılmış bir API hata yanıtı oluşturur ve sunucuya loglar.
 * @param message - İstemciye gösterilecek Türkçe hata mesajı.
 * @param status - HTTP durum kodu (varsayılan: 500).
 * @param error - (Opsiyonel) Orijinal hata nesnesi, loglama için.
 * @returns {NextResponse} Standart bir JSON hata formatında yanıt.
 */
function apiError(message: string, status: number = 500, error?: any): NextResponse {
  // Hatanın detaylarını sunucu konsoluna logla
  console.error(`API Hatası (Status: ${status}): ${message}`, error ? { error } : '');
  return NextResponse.json({ error: message }, { status });
}

// Projenin ana dizinlerine statik yollar
const contentDir = path.join(process.cwd(), "content");
const publicDir = path.join(process.cwd(), "public");

// Güvenlik katmanı: API üzerinden yönetilmesine izin verilen içerik türleri.
const ALLOWED_TYPES = ['popups', 'messages', 'skills', 'experiences', 'testimonials', 'home-settings', 'seo-settings', 'blog', 'projects', 'about'];

// POST isteğiyle gelen gövdeyi (body) doğrulamak için Zod şeması.
const contentPostSchema = z.object({
  type: z.enum(ALLOWED_TYPES as [string, ...string[]], {
    errorMap: () => ({ message: "Geçersiz içerik türü belirtildi." }),
  }),
  slug: z.string().min(1, "İçerik kimliği (slug) boş olamaz."),
  originalSlug: z.string().optional(), // Güncelleme işlemlerinde eski slug'ı takip etmek için
  data: z.union([z.record(z.any()), z.array(z.any())], {
    errorMap: () => ({ message: "Veri formatı geçersiz. Nesne veya dizi olmalı." }),
  }), // .md'deki front-matter veya .json içeriği (dizi veya nesne olabilir)
  content: z.string().optional(), // .md dosyasının ana metin içeriği
});

/**
 * Güvenli bir dosya yolu oluşturur ve yolun 'content' dizini dışına çıkmasını engeller.
 * Path Traversal gibi zafiyetleri önlemek için kritik bir fonksiyondur.
 * @param type - İçerik türü (örn: 'blog', 'projects').
 * @param slug - Dosya adı veya kimliği (örn: 'ilk-yazim.md').
 * @returns {string | null} Güvenli dosya yolu veya geçersiz bir tür/slug girildiyse null.
 */
function getSafePath(type: string, slug?: string): string | null {
  if (!ALLOWED_TYPES.includes(type)) return null;

  // Slug'ı normalize ederek '../' gibi ifadelerle dizin dışına çıkma denemelerini engelle.
  const safeSlug = slug ? path.normalize(slug).replace(/^(\.\.(\/|\\|$))+/, '') : '';

  // Kök 'content' dizininde bulunan özel dosyalar için bir istisna listesi.
  const isRootFile = ['about.md', 'skills.json', 'experiences.json', 'home-settings.json', 'seo-settings.json'].includes(safeSlug);

  // Dosya yolunu oluştur: Eğer kök dosya ise doğrudan 'content' altına, değilse 'content/tür/' altına koy.
  const finalPath = isRootFile
    ? path.join(contentDir, safeSlug)
    : (slug ? path.join(contentDir, type, safeSlug) : path.join(contentDir, type));

  // Son bir güvenlik kontrolü: Oluşturulan yolun hala 'contentDir' ile başladığından emin ol.
  if (!finalPath.startsWith(contentDir)) return null;

  return finalPath;
}

/**
 * İçerik türüne göre dosya uzantısını belirler.
 * @param type - İçerik türü.
 * @returns {'.md' | '.json'} Dosya uzantısı.
 */
function getFileExtension(type: string): string {
  // Blog, projeler ve hakkımda sayfaları Markdown kullanır, diğerleri JSON.
  return ['blog', 'projects', 'about'].includes(type) ? '.md' : '.json';
}

/**
 * Bir içerik değiştiğinde, o içeriği gösteren sayfaların Next.js önbelleğini temizler (revalidate).
 * Bu, kullanıcıların sitede her zaman en güncel içeriği görmesini sağlar.
 * @param type - Değiştirilen içeriğin türü.
 * @param slug - Değiştirilen içeriğin kimliği (slug).
 */
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
  // Her durumda ana sayfa ve genel layout'u da yenilemek, genel tutarlılık için iyidir.
  revalidatePath('/');
  revalidatePath('/layout');
}

// --- HTTP METOTLARI ---

/**
 * GET: İçerik listesini veya tek bir içeriği getirir.
 * - `?type=blog`: Blog yazılarını listeler.
 * - `?type=blog&slug=ilk-yazim`: 'ilk-yazim.md' dosyasının içeriğini getirir.
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim. Lütfen giriş yapın.", 401);

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const type = typeParam ? typeParam.split(':')[0] : null; // "skills:1" gibi gelen parametreleri temizle
  const slug = searchParams.get("slug");

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return apiError("Geçersiz veya eksik 'type' parametresi.", 400);
  }

  // --- Tek Bir İçeriği Getirme ---
  if (slug) {
    const fileExtension = getFileExtension(type);
    const slugWithExt = slug.endsWith(fileExtension) ? slug : `${slug}${fileExtension}`;
    const filePath = getSafePath(type, slugWithExt);

    if (!filePath) return apiError("Oluşturulan dosya yolu geçersiz.", 400);

    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      if (filePath.endsWith('.json')) {
        return NextResponse.json(JSON.parse(fileContent));
      }
      const { data, content } = matter(fileContent);
      return NextResponse.json({ data, content });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return apiError("İstenen içerik dosyası bulunamadı.", 404, error);
      }
      return apiError("Sunucu hatası: Dosya okunurken bir problem oluştu.", 500, error);
    }
  }

  // --- İçerik Listesi Getirme ---
  const dirPath = getSafePath(type);
  if (!dirPath) return apiError("Geçersiz içerik tipi nedeniyle dizin yolu oluşturulamadı.", 400);

  // Öncelik: Kök dizindeki JSON dosyasını kontrol et (örn: content/experiences.json).
  const rootFilePath = path.join(contentDir, `${type}.json`);
  try {
    await fs.access(rootFilePath); // Dosyanın varlığını kontrol et.
    const fileContent = await fs.readFile(rootFilePath, 'utf-8');
    return NextResponse.json(JSON.parse(fileContent));
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') { // 'Dosya bulunamadı' dışında bir hataysa logla.
      console.error(`Kök içerik dosyası (${rootFilePath}) okunurken beklenmedik bir hata oluştu. Alt dizine geçiliyor.`, err);
    }
    // Dosya bulunamazsa, alt dizini okumaya devam et (bu bir hata değil, beklenen bir durum).
  }

  // İkincil Yol (Fallback): Alt dizini oku (örn: content/projects/).
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

    // `skills` ve `experiences` gibi türlerde, sonuç [[...]] şeklinde çift sarmalanmış bir dizi ise,
    // içteki diziyi çıkararak istemciye temiz bir dizi gönder.
    if (['skills', 'experiences'].includes(type) && finalContent.length === 1 && Array.isArray(finalContent[0])) {
      finalContent = finalContent[0];
    }

    return NextResponse.json(finalContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') { // Eğer 'content/tür' dizini hiç yoksa, boş bir dizi döndür.
      return NextResponse.json([]);
    }
    return apiError("İçerik listesi okunurken bir sunucu hatası oluştu.", 500, error);
  }
}

/**
 * DELETE: Bir içeriği ve (varsa) ilişkili görsellerini siler.
 */
export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim. Lütfen giriş yapın.", 401);

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const type = typeParam ? typeParam.split(':')[0] : null;
  const slugWithExt = searchParams.get("slug");

  if (!type || !slugWithExt || !ALLOWED_TYPES.includes(type)) {
    return apiError("Geçersiz veya eksik 'type' ve 'slug' parametreleri.", 400);
  }

  const filePath = getSafePath(type, slugWithExt);
  if (!filePath) return apiError("Silinecek dosya için geçersiz yol.", 400);

  // Ana dosyayı silmeden önce, içindeki görsel yollarını bulıp silmeyi dene.
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const imageUrls = (fileContent.match(/\/images\/[a-zA-Z0-9-]+\.(webp|jpg|png|jpeg|gif)/g) || []);
    
    for (const imageUrl of [...new Set(imageUrls)]) { // Tekrarları kaldır
      const imagePath = path.join(publicDir, path.normalize(imageUrl));
      if (!imagePath.startsWith(publicDir)) continue; // Güvenlik kontrolü
      try {
        await fs.unlink(imagePath);
        console.log(`İlişkili görsel silindi: ${imagePath}`);
      } catch (imgError: any) {
        if (imgError.code !== 'ENOENT') { // Dosya zaten yoksa hata basma
          console.error(`İlişkili görsel (${imagePath}) silinirken hata oluştu, ancak ana işlem devam ediyor.`, imgError);
        }
      }
    }
  } catch (readError: any) {
    if (readError.code !== 'ENOENT') {
      console.error(`İçerik dosyası (${filePath}) okunurken hata, ancak silme işlemine devam ediliyor.`, readError);
    }
  }

  // Ana içerik dosyasını sil.
  try {
    await fs.unlink(filePath);
    const cleanSlug = slugWithExt.replace(/\.(mdx?|json)$/, '');
    revalidateContentPaths(type, cleanSlug);
    await commitContentChange({ action: 'delete', fileType: type, slug: cleanSlug, user: token.email || "Bilinmeyen" });
    return NextResponse.json({ message: "İçerik ve ilişkili tüm veriler başarıyla silindi." });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return apiError("Silinecek dosya bulunamadı.", 404, error);
    }
    return apiError("Dosya silinirken bir sunucu hatası oluştu.", 500, error);
  }
}

/**
 * POST: Yeni bir içerik oluşturur veya mevcut bir içeriği günceller.
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim. Lütfen giriş yapın.", 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return apiError("İstek gövdesi (body) JSON formatında değil veya boş.", 400, e);
  }
  
  const validation = contentPostSchema.safeParse(body);
  if (!validation.success) {
    // Zod'un hata mesajlarını birleştirerek daha anlaşılır bir çıktı oluştur.
    const errorMessage = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
    return apiError(`Geçersiz istek verisi: ${errorMessage}`, 400, validation.error);
  }

  const { type, slug, originalSlug, data, content } = validation.data;

  try {
    const fileExtension = getFileExtension(type);
    const newFileName = slug.endsWith(fileExtension) ? slug : slug + fileExtension;
    const newFilePath = getSafePath(type, newFileName);

    if (!newFilePath) return apiError("Kaydedilecek dosya için geçersiz yol belirtildi.", 400);

    const dirPath = path.dirname(newFilePath);
    await fs.mkdir(dirPath, { recursive: true }); // Dizinin var olduğundan emin ol.

    const isUpdating = originalSlug && slug === originalSlug;
    // Yeni içerik oluşturulurken aynı slug'a sahip bir dosya varsa çakışmayı önle.
    if (!isUpdating && !originalSlug) {
      try {
        await fs.access(newFilePath);
        return apiError(`Bu kimliğe ('${slug}') sahip bir içerik zaten var. Lütfen farklı bir kimlik kullanın.`, 409);
      } catch (e) { /* Dosya yok, devam edilebilir. */ }
    }

    // Slug değiştirildiyse, eski dosyayı sil.
    if (originalSlug && slug !== originalSlug) {
      const oldFilePath = getSafePath(type, originalSlug + fileExtension);
      if (oldFilePath) {
        try {
          await fs.unlink(oldFilePath);
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            console.error(`Slug değiştirildiği için eski dosya (${oldFilePath}) silinirken bir hata oluştu.`, error);
          }
        }
      }
    }

    // Dosya içeriğini oluştur ve diske yaz.
    const fileContent = fileExtension === '.json'
      ? JSON.stringify(data, null, 2) // JSON'u formatlı yaz
      : matter.stringify(content || "", data); // Markdown'ı front-matter ile birleştir
    await fs.writeFile(newFilePath, fileContent, "utf-8");

    // İlgili sayfaların önbelleğini temizle.
    const cleanSlug = slug.replace(/\.(mdx?|json)$/, '');
    revalidateContentPaths(type, cleanSlug);
    if (originalSlug && slug !== originalSlug) {
      revalidateContentPaths(type, originalSlug);
    }

    // Değişikliği Git'e commit'le.
    await commitContentChange({
      action: isUpdating || (originalSlug && slug !== originalSlug) ? 'update' : 'create',
      fileType: type,
      slug: cleanSlug,
      user: token.email || "Bilinmeyen Kullanıcı"
    });

    return NextResponse.json({ message: "İçerik başarıyla kaydedildi!" });
  } catch (error) {
    console.error("İçerik kaydedilirken kritik bir hata oluştu:", error);
    return apiError("İçerik kaydedilemedi. Sunucu loglarını kontrol edin.", 500, error);
  }
}