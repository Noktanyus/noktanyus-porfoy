"use client";

import { HomeSettings } from "@/types/content";
import dynamic from "next/dynamic";

const ClientOnlyHtml = dynamic(() => import("@/components/ClientOnlyHtml"), { ssr: false });

interface FeaturedContentProps {
  homeSettings: HomeSettings | null;
}

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

/** Müzik / eğlence videolarını portföy akışında varsayılan kapalı tut. */
function isLikelyEntertainmentVideo(url: string): boolean {
  return /official\s*music|music\s*video|vevo|lyric|spotify|blok3|şarkı|klip/i.test(url);
}

export default function FeaturedContent({ homeSettings }: FeaturedContentProps) {
  const videoId =
    homeSettings?.featuredContentType === "video" && homeSettings?.youtubeUrl
      ? getYouTubeId(homeSettings.youtubeUrl)
      : null;

  if (!homeSettings?.featuredContentType) return null;

  if (homeSettings.featuredContentType === "video" && !videoId) return null;
  if (homeSettings.featuredContentType === "text" && !homeSettings.textTitle) return null;
  if (homeSettings.featuredContentType === "html" && !homeSettings.customHtml) return null;

  const entertainment =
    homeSettings.featuredContentType === "video" &&
    isLikelyEntertainmentVideo(homeSettings.youtubeUrl || "");

  return (
    <div className="relative flex flex-col items-center justify-center py-6 sm:py-10 gap-4">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
          Öne çıkan
        </p>
        {homeSettings.featuredContentType === "video" && !entertainment && (
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Seçili video
          </h2>
        )}
      </div>

      {videoId && entertainment && (
        <details className="w-full max-w-2xl group rounded-2xl border border-border/80 bg-card/50 dark:bg-slate-900/40 p-4">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-semibold text-foreground">
            <span>İsteğe bağlı video (CMS)</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-open:hidden">
              Göster
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden group-open:inline">
              Gizle
            </span>
          </summary>
          <div className="mt-4 aspect-video rounded-xl overflow-hidden border border-border shadow-lg">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Öne Çıkan YouTube Videosu"
              loading="lazy"
            />
          </div>
        </details>
      )}

      {videoId && !entertainment && (
        <div className="w-full max-w-2xl relative z-10">
          <div className="aspect-video rounded-2xl overflow-hidden border border-border shadow-lg">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Öne Çıkan YouTube Videosu"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {homeSettings.featuredContentType === "text" && homeSettings.textTitle && (
        <div className="w-full max-w-2xl glass-card p-6 sm:p-8 relative z-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">
            {homeSettings.textTitle}
          </h2>
          {homeSettings.textContent && (
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {homeSettings.textContent}
            </p>
          )}
        </div>
      )}

      {homeSettings.featuredContentType === "html" && homeSettings.customHtml && (
        <div className="w-full max-w-2xl relative z-10">
          <div className="glass-card p-6">
            <ClientOnlyHtml html={homeSettings.customHtml} />
          </div>
        </div>
      )}
    </div>
  );
}
