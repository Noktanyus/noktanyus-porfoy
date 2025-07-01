import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { commitContentChange } from "@/lib/git-utils";

const contentDir = path.join(process.cwd(), "content");
const ALLOWED_TYPES = ['popups', 'messages', 'skills', 'experiences', 'testimonials', 'home-settings', 'seo-settings', 'blog', 'projects', 'about'];
const SINGLETON_TYPES = ['about', 'home-settings', 'seo-settings', 'skills'];

// Güvenli dosya yolu oluşturur ve Path Traversal saldırılarını önler.
function getSafePath(type: string, slug?: string): string | null {
  if (!ALLOWED_TYPES.includes(type)) {
    console.error(`Invalid content type: ${type}`);
    return null;
  }
  const safeSlug = slug ? path.normalize(slug).replace(/^(\.\.(\/|\\|$))+/, '') : '';
  const finalPath = type === 'about' 
    ? path.join(contentDir, safeSlug)
    : (slug ? path.join(contentDir, type, safeSlug) : path.join(contentDir, type));

  if (!finalPath.startsWith(contentDir)) {
    console.error(`Attempted path traversal: ${finalPath}`);
    return null;
  }
  return finalPath;
}

function getFileExtension(type: string): string {
  if (['popups', 'messages', 'skills', 'experiences', 'testimonials', 'home-settings', 'seo-settings'].includes(type)) {
    return '.json';
  }
  return '.md';
}

// Revalidation logic based on content type
function revalidateContentPaths(type: string, slug?: string) {
    if (type === 'about' || type === 'skills' || type === 'experiences') {
        revalidatePath('/hakkimda');
    } else if (type === 'projects') {
        revalidatePath('/projelerim');
        if (slug) {
            revalidatePath(`/projelerim/${slug}`);
        }
    } else if (type === 'blog') {
        revalidatePath('/blog');
        if (slug) {
            revalidatePath(`/blog/${slug}`);
        }
    } else if (type === 'popups') {
        // Popups are client-side, but we can revalidate the home page
        // in case they are linked from there.
        revalidatePath('/');
    }
    // Revalidate home page for most content changes
    revalidatePath('/');
}


// Bir dizindeki tüm dosyaları listelemek için
async function listContent(type: string) {
  const dirPath = getSafePath(type);
  if (!dirPath) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }
  
  if (type === 'skills') {
    try {
      const filePath = path.join(contentDir, 'skills.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      return NextResponse.json(data);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return NextResponse.json([]);
      }
      throw error;
    }
  }

  try {
    const files = await fs.readdir(dirPath);
    const contentPromises = files
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx') || file.endsWith('.json'))
      .map(async (file) => {
        const filePath = path.join(dirPath, file);
        const fileContent = await fs.readFile(filePath, "utf-8");
        if (file.endsWith('.json')) {
          const data = JSON.parse(fileContent);
          return {
            slug: file.replace(/\.json$/, ''),
            ...data
          };
        }
        const { data } = matter(fileContent);
        return {
          slug: file.replace(/\.mdx?$/, ''),
          title: data.title || file,
          ...data
        };
      });
    const content = await Promise.all(contentPromises);
    return NextResponse.json(content);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json([]);
    }
    throw error;
  }
}

// Tek bir dosyayı getirmek için
async function getContent(type: string, slug: string) {
    const fileExtension = getFileExtension(type);
    const fileName = slug.endsWith(fileExtension) ? slug : slug + fileExtension;
    const filePath = getSafePath(type, fileName);

    if (!filePath) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    try {
        const fileContent = await fs.readFile(filePath, "utf-8");

        if (filePath.endsWith('.json')) {
            const jsonData = JSON.parse(fileContent);
            return NextResponse.json(jsonData);
        }

        const { data, content } = matter(fileContent);
        return NextResponse.json({ data, content });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


// Bir dosyayı silmek için
async function deleteContent(type: string, slug: string, user: string) {
    const fileExtension = getFileExtension(type);
    // Slug'dan mevcut uzantıları temizle, sonra doğru olanı ekle.
    const cleanSlug = slug.replace(/\.mdx?$/, '').replace(/\.json$/, '');
    const fileName = cleanSlug + fileExtension;
    const filePath = getSafePath(type, fileName);

    if (!filePath) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    try {
        await fs.unlink(filePath);
        revalidateContentPaths(type, cleanSlug);
        await commitContentChange({ action: 'delete', fileType: type, slug: cleanSlug, user });
        return NextResponse.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Error deleting file:", error);
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return NextResponse.json({ error: "File not found to delete" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");

  if (!type) {
    return NextResponse.json({ error: "Type parameter is required" }, { status: 400 });
  }

  if (slug) {
    return getContent(type, slug);
  }

  return listContent(type);
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");

  if (!type || !slug) {
    return NextResponse.json({ error: "Type and slug parameters are required" }, { status: 400 });
  }

  return deleteContent(type, slug, token.email || "Unknown User");
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, slug, originalSlug, data, content } = body;

  if (typeof type !== 'string' || !slug || !data) {
    return NextResponse.json({ error: "Missing required fields: type, slug, data" }, { status: 400 });
  }

  const fileExtension = getFileExtension(type);
  const newFileName = slug.endsWith(fileExtension) ? slug : slug + fileExtension;
  const newFilePath = getSafePath(type, newFileName);

  if (!newFilePath) {
      return NextResponse.json({ error: "Invalid path specified" }, { status: 400 });
  }

  try {
    const dirPath = path.dirname(newFilePath);
    await fs.mkdir(dirPath, { recursive: true });

    const isSingleton = SINGLETON_TYPES.includes(type);
    const isCreating = !originalSlug && !isSingleton;
    const isRenaming = originalSlug && slug !== originalSlug;

    if (isCreating || isRenaming) {
      try {
        await fs.access(newFilePath);
        return NextResponse.json(
          { error: `Slug "${slug}" already exists. Please choose a unique slug.` },
          { status: 409 }
        );
      } catch (error) {
        // File does not exist, which is what we want.
      }
    }

    if (isRenaming) {
      const oldFileName = originalSlug + fileExtension;
      const oldFilePath = getSafePath(type, oldFileName);
      if (oldFilePath) {
          try {
              await fs.rename(oldFilePath, newFilePath);
          } catch (renameError) {
              if (renameError instanceof Error && 'code' in renameError && renameError.code !== 'ENOENT') {
                  throw renameError;
              }
          }
      }
    }

    let fileContent;
    if (fileExtension === '.json') {
      fileContent = JSON.stringify(data, null, 2);
    } else {
      fileContent = matter.stringify(content || "", data);
    }
    
    await fs.writeFile(newFilePath, fileContent, "utf-8");
    
    const cleanSlug = slug.replace(/\.mdx?$/, '').replace(/\.json$/, '');
    revalidateContentPaths(type, cleanSlug);
    if (isRenaming && originalSlug) {
        revalidateContentPaths(type, originalSlug);
    }

    await commitContentChange({
      action: isCreating ? 'create' : 'update',
      fileType: type,
      slug: cleanSlug,
      user: token.email || "Unknown User"
    });

    return NextResponse.json({ message: "Content saved successfully!" });

  } catch (error) {
    console.error("Error saving content:", error);
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 });
  }
}