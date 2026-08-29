/**
 * @file Admin Theme API
 * @description Kullanıcının tema tercihini getir/kaydet.
 *              POST: presetId kaydet
 *              GET: mevcut preset'i getir
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userThemeService } from "@/modules/themes/types";
import { isThemePresetId } from "@/modules/themes/presets";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ presetId: "default" });
    }
    const presetId = await userThemeService.getPreference(userId);
    return NextResponse.json({ presetId });
  } catch (err) {
    logger.warn("[themes-api] GET failed:", err);
    return NextResponse.json({ presetId: "default" });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const presetId = body?.presetId;

    if (!isThemePresetId(presetId)) {
      return NextResponse.json(
        { error: "Invalid presetId" },
        { status: 400 }
      );
    }

    await userThemeService.setPreference(userId, presetId);
    return NextResponse.json({ success: true, presetId });
  } catch (err) {
    logger.error("[themes-api] POST failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}