// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { commitContentChange } from "@/lib/git-utils";

const contentDir = path.join(process.cwd(), "content");
const publicDir = path.join(process.cwd(), "public");

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (!file) {
    return NextResponse.json({ error: "File parameter is required" }, { status: 400 });
  }

  try {
    const filePath = path.join(contentDir, file);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { file, data, robotsTxt } = await request.json();

  if (!file || !data) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Write to the JSON settings file
    const filePath = path.join(contentDir, file);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

    // If robotsTxt content is provided, write to public/robots.txt
    if (typeof robotsTxt === 'string') {
      const robotsPath = path.join(publicDir, "robots.txt");
      await fs.writeFile(robotsPath, robotsTxt, "utf-8");
    }

    // Revalidate paths after updating settings
    if (file === 'home-settings.json') {
      revalidatePath('/');
    } else if (file === 'seo-settings.json') {
      revalidatePath('/', 'layout');
    }

    await commitContentChange({
      action: 'update',
      fileType: 'settings',
      slug: file,
      user: token.email || "Unknown User",
    });

    return NextResponse.json({ message: "Settings saved successfully!" });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}