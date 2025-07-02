/**
 * @file İçerik yönetimi için ana API rotası.
 * @description Bu dosya, projedeki tüm içerik türleri (blog, projeler, popups vb.)
 *              için CRUD (Oluşturma, Okuma, Güncelleme, Silme) işlemlerini yönetir.
 *              Kimlik doğrulama, dosya işlemleri, önbellek temizleme ve Git'e commit
 *              atma gibi işlemleri gerçekleştirir.
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

/**
 * Hata yanıtlarını standartlaştırmak için yardımcı fonksiyon.
 * @param message - İstemciye gönderilecek hata mesajı.
 * @param status - HTTP durum kodu (varsayılan: 500).
 * @returns {NextResponse} Standart bir JSON hata yanıtı.
 */
function apiError(message: string, status: number = 500): NextResponse {
  console.error(`API Hatası: ${message} (Status: ${status})`);
  return NextResponse.json({ error: message }, { status });
}

// Ana içerik ve public dizinlerinin yolları
const contentDir = path.join(process.cwd(), "content");
const publicDir = path.join(process.cwd(), "public");

// İzin verilen içerik türleri. Güvenlik için bu liste dışındaki türler işlenmez.
const ALLOWED_TYPES = ['popups', 'messages', 'skills', 'experiences', 'testimonials', 'home-settings', 'seo-settings', 'blog', 'projects', 'about'];

// Gelen POST isteğinin gövdesini doğrulamak için Zod şeması
const contentPostSchema = z.object({
  type: z.enum(ALLOWED_TYPES as [string, ...string[]]),
  slug: z.string().min(1, "Slug boş olamaz."),
  originalSlug: z.string().optional(), // Güncelleme işlemleri için eski slug
  data: z.record(z.any()), // 'data' nesnesi herhangi bir anahtar/değer içerebilir
  content: z.string().optional(), // Markdown içeriği
});

/**
 * Güvenli bir dosya yolu oluşturur ve yolun 'content' dizini dışına çıkmadığından emin olur.
 * @param type - İçerik türü (örn: 'blog').
 * @param slug - Dosya adı (örn: 'ilk-yazim.md').
 * @returns {string | null} Güvenli dosya yolu veya geçersizse null.
 */
function getSafePath(type: string, slug?: string): string | null {
  if (!ALLOWED_TYPES.includes(type)) return null;
  // Path traversal saldırılarını önlemek için slug'ı temizle
  const safeSlug = slug ? path.normalize(slug).replace(/^(\.\.(\/|\\|$))+/, '') : '';
  
  // Kök dizindeki dosyalar için özel durum
  const isRootFile = ['about.md', 'skills.json', 'experiences.json', 'home-settings.json', 'seo-settings.json'].includes(safeSlug);
  
  const finalPath = isRootFile
    ? path.join(contentDir, safeSlug)
    : (slug ? path.join(contentDir, type, safeSlug) : path.join(contentDir, type));

  // Oluşturulan yolun hala contentDir içinde olduğundan emin ol
  if (!finalPath.startsWith(contentDir)) return null;
  
  return finalPath;
}

/**
 * İçerik türüne göre dosya uzantısını döndürür.
 * @param type - İçerik türü.
 * @returns {'.md' | '.json'} Dosya uzantısı.
 */
function getFileExtension(type: string): string {
  return ['blog', 'projects', 'about'].includes(type) ? '.md' : '.json';
}

/**
 * Bir içerik değiştirildiğinde ilgili sayfaların önbelleğini temizler (revalidate).
 * @param type - Değiştirilen içeriğin türü.
 * @param slug - Değiştirilen içeriğin slug'ı.
 */
function revalidateContentPaths(type: string, slug?: string) {
    if (type === 'about' || type === 'skills' || type === 'experiences') revalidatePath('/hakkimda');
    else if (type === 'projects') {
        revalidatePath('/projelerim');
        if (slug) revalidatePath(`/projelerim/${slug}`);
    } else if (type === 'blog') {
        revalidatePath('/blog');
        if (slug) revalidatePath(`/blog/${slug}`);
    }
    // Her durumda ana sayfayı ve genel layout'u da yenilemek genellikle iyi bir fikirdir.
    revalidatePath('/');
    revalidatePath('/layout');
}

// --- HTTP Metotları ---

/**
 * GET isteği: İçerik listesini veya tek bir içeriği getirir.
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim.", 401);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");
  const action = searchParams.get("action");

  if (!type || !ALLOWED_TYPES.includes(type)) return apiError("Geçersiz veya eksik 'type' parametresi.", 400);

  // Tek bir içerik getirme
  if (slug) {
    const filePath = getSafePath(type, slug);
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

  // İçerik listesi getirme
  if (action === 'list') {
    const dirPath = getSafePath(type);
    if (!dirPath) return apiError("Geçersiz içerik tipi.", 400);
    try {
      const files = await fs.readdir(dirPath);
      const contentPromises = files
        .filter(file => file.endsWith('.md') || file.endsWith('.json'))
        .map(async (file) => {
          const filePath = path.join(dirPath, file);
          const fileContent = await fs.readFile(filePath, "utf-8");
          const slug = file.replace(/\.(mdx?|json)$/, '');
          if (file.endsWith('.json')) return { slug, ...JSON.parse(fileContent) };
          const { data } = matter(fileContent);
          return { slug, title: data.title || file, ...data };
        });
      return NextResponse.json(await Promise.all(contentPromises));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return NextResponse.json([]);
      return apiError("İçerik listesi okunurken hata.", 500);
    }
  }
  
  return apiError("Geçersiz istek. 'slug' veya 'action=list' parametresi gerekli.", 400);
}

/**
 * DELETE isteği: Bir içeriği ve ilişkili görsellerini siler.
 */
export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim.", 401);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slugWithExt = searchParams.get("slug"); // slug artık dosya uzantısını içeriyor (örn: yazi.md)

  if (!type || !slugWithExt || !ALLOWED_TYPES.includes(type)) {
    return apiError("Geçersiz veya eksik 'type' ve 'slug' parametreleri.", 400);
  }

  const filePath = getSafePath(type, slugWithExt);
  if (!filePath) return apiError("Geçersiz dosya yolu.", 400);

  // Silmeden önce, dosyadan ilişkili görsellerin yollarını çıkar
  let imageUrlsToDelete: string[] = [];
  try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      // Markdown dosyalarındaki ![](/images/...) desenini ara
      const markdownImageUrls = (fileContent.match(/!\[.*?\]\((.*?)\)/g) || [])
          .map(mdLink => mdLink.match(/\((.*?)\)/)?.[1])
          .filter((url): url is string => !!url && url.startsWith('/images/'));
      imageUrlsToDelete.push(...markdownImageUrls);

      // JSON dosyalarındaki potansiyel görsel anahtarlarını ara
      if (slugWithExt.endsWith('.json')) {
          const jsonData = JSON.parse(fileContent);
          const findImageUrls = (obj: any) => {
              for (const key in obj) {
                  if (typeof obj[key] === 'string' && obj[key].startsWith('/images/')) {
                      imageUrlsToDelete.push(obj[key]);
                  } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                      findImageUrls(obj[key]);
                  }
              }
          };
          findImageUrls(jsonData);
      }
  } catch (readError: any) {
      if (readError.code !== 'ENOENT') {
          console.error(`İçerik dosyası okunurken hata (silme işlemine devam ediliyor): ${filePath}`, readError);
      }
  }

  // İlişkili görselleri sil
  for (const imageUrl of [...new Set(imageUrlsToDelete)]) { // Tekrarları kaldır
      const imagePath = path.join(publicDir, path.normalize(imageUrl));
      if (!imagePath.startsWith(publicDir)) continue; // Güvenlik kontrolü
      try {
          await fs.unlink(imagePath);
          console.log(`İlişkili görsel silindi: ${imagePath}`);
      } catch (imgError: any) {
          if (imgError.code !== 'ENOENT') {
              console.error(`Görsel silinirken hata (işleme devam ediliyor): ${imagePath}`, imgError);
          }
      }
  }

  // Ana içerik dosyasını sil
  try {
      await fs.unlink(filePath);
      const cleanSlug = slugWithExt.replace(/\.(mdx?|json)$/, '');
      revalidateContentPaths(type, cleanSlug);
      await commitContentChange({ action: 'delete', fileType: type, slug: cleanSlug, user: token.email || "Bilinmeyen Kullanıcı" });
      return NextResponse.json({ message: "İçerik ve ilişkili görseller başarıyla silindi." });
  } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return apiError("Silinecek dosya bulunamadı.", 404);
      return apiError("Dosya silinemedi.", 500);
  }
}

/**
 * POST isteği: Yeni bir içerik oluşturur veya mevcut bir içeriği günceller.
 */
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
    // Eğer yeni bir içerik oluşturuluyorsa ve aynı slug'a sahip bir dosya zaten varsa, hata ver.
    if (!isUpdating && !originalSlug) {
      try {
        await fs.access(newFilePath);
        return apiError(`Bu kimliğe ('${slug}') sahip bir içerik zaten mevcut. Lütfen farklı bir slug kullanın.`, 409);
      } catch (error) {
        // Dosya yok, devam edilebilir.
      }
    }

    // Slug değiştirildiyse, eski dosyayı sil.
    if (originalSlug && slug !== originalSlug) {
      const oldFilePath = getSafePath(type, originalSlug + fileExtension);
      if (oldFilePath) {
        try { await fs.unlink(oldFilePath); } 
        catch (error) { if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') console.error(`Eski dosya silinirken hata: ${oldFilePath}`, error); }
      }
    }

    // Dosya içeriğini oluştur ve yaz.
    const fileContent = fileExtension === '.json' ? JSON.stringify(data, null, 2) : matter.stringify(content || "", data);
    await fs.writeFile(newFilePath, fileContent, "utf-8");
    
    // İlgili yolların önbelleğini temizle.
    const cleanSlug = slug.replace(/\.(mdx?|json)$/, '');
    revalidateContentPaths(type, cleanSlug);
    if (originalSlug && slug !== originalSlug) revalidateContentPaths(type, originalSlug);

    // Değişikliği Git'e commit'le.
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
