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

export default function FeaturedContent({ homeSettings }: FeaturedContentProps) {
  const videoId =
    homeSettings?.featuredContentType === "video" && homeSettings?.youtubeUrl
      ? getYouTubeId(homeSettings.youtubeUrl)
      : null;

  if (!homeSettings?.featuredContentType) return null;

  if (homeSettings.featuredContentType === "video" && !videoId) return null;
  if (homeSettings.featuredContentType === "text" && !homeSettings.textTitle) return null;
  if (homeSettings.featuredContentType === "html" && !homeSettings.customHtml) return null;

  return (
    <div className="relative flex items-center justify-center py-4 sm:py-6">
      {videoId && (
        <div className="w-full max-w-2xl relative z-10">
          <div className="aspect-video rounded-2xl overflow-hidden border border-border shadow-lg">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Öne Çıkan YouTube Videosu"
            />
          </div>
        </div>
      )}

      {homeSettings.featuredContentType === "text" && homeSettings.textTitle && (
        <div className="w-full max-w-2xl glass-card p-6 sm:p-8 relative z-10 text-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">
            {homeSettings.textTitle}
          </h3>
          {homeSettings.textContent && (
            <p className="text-muted-foreground leading-relaxed">
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
