import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { commitContentChange } from "@/lib/git-utils";

// Hata yanıtlarını standartlaştırmak için yardımcı fonksiyon
function apiError(message: string, status: number = 500) {
  console.error(`API Hatası: ${message} (Status: ${status})`);
  return NextResponse.json({ error: message }, { status });
}

const contentDir = path.join(process.cwd(), "content");
const ALLOWED_TYPES = ['popups', 'messages', 'skills', 'experiences', 'testimonials', 'home-settings', 'seo-settings', 'blog', 'projects', 'about'];

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
  if (['skills', 'experiences'].includes(type)) {
    try {
      const filePath = path.join(contentDir, `${type}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return NextResponse.json(JSON.parse(fileContent));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return NextResponse.json([]);
      throw error;
    }
  }
  
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

    // Markdown dosyaları için ilişkili görselleri sil
    if (fileExtension === '.md') {
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            // Regex to find all local image paths like ![](/images/...)
            const imageUrls = (fileContent.match(/!\[.*?\]\(\/images\/.*?\)/g) || [])
                .map(mdLink => mdLink.match(/\(\/images\/.*?\)/)?.[0].slice(1, -1));

            if (imageUrls.length > 0) {
                console.log(`'${slug}' içeriği için silinecek ${imageUrls.length} adet görsel bulundu.`);
                for (const imageUrl of imageUrls) {
                    const imagePath = path.join(process.cwd(), 'public', imageUrl);
                    try {
                        await fs.unlink(imagePath);
                        console.log(`Görsel başarıyla silindi: ${imagePath}`);
                    } catch (imgError: any) {
                        // İstenildiği gibi, görsel silinemezse hatayı logla ve devam et
                        if (imgError.code !== 'ENOENT') { // Dosya zaten yoksa hata basma
                            console.error(`Görsel silinirken bir hata oluştu, ancak işleme devam ediliyor. Dosya: ${imagePath}, Hata: ${imgError.message}`);
                        }
                    }
                }
            }
        } catch (readError: any) {
            // Dosya okunamasa bile silme işlemine devam etmeyi dene, belki sadece dosya vardır içerik yoktur.
            if (readError.code !== 'ENOENT') {
                console.error(`İçerik dosyası okunurken bir hata oluştu, ancak silme işlemine devam edilecek. Dosya: ${filePath}, Hata: ${readError.message}`);
            }
        }
    }

    try {
        await fs.unlink(filePath);
        revalidateContentPaths(type, cleanSlug);
        await commitContentChange({ action: 'delete', fileType: type, slug: cleanSlug, user });
        return NextResponse.json({ message: "Dosya ve ilişkili görseller başarıyla silindi." });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return apiError("Silinecek dosya bulunamadı.", 404);
        return apiError("Dosya silinemedi.", 500);
    }
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim.", 401);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");

  if (!type) return apiError("'type' parametresi gerekli.", 400);
  if (slug) return getContent(type, slug);
  return listContent(type);
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim.", 401);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");

  if (!type || !slug) return apiError("'type' ve 'slug' parametreleri gerekli.", 400);
  return deleteContent(type, slug, token.email || "Bilinmeyen Kullanıcı");
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return apiError("Yetkisiz erişim.", 401);

  try {
    const body = await request.json();
    const { type, slug, originalSlug, data, content } = body;

    if (!type || !slug || !data) return apiError("Eksik alanlar: 'type', 'slug' ve 'data' gereklidir.", 400);

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