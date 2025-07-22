"use client";

import ClientOnlyHtml from "@/components/ClientOnlyHtml";
import { HomeSettings } from "@/types/content";

interface FeaturedContentProps {
  homeSettings: HomeSettings;
}

// YouTube video ID'sini URL'den çıkaran yardımcı fonksiyon
const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export default function FeaturedContent({ homeSettings }: FeaturedContentProps) {
  const videoId =
    homeSettings.featuredContentType === "video" && homeSettings.youtubeUrl
      ? getYouTubeId(homeSettings.youtubeUrl)
      : null;

  return (
    <div className="relative flex items-center justify-center min-h-[250px]">
      {videoId && (
        <div className="w-full max-w-lg animate-float">
          <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-2xl border-4 border-gray-300 dark:border-gray-700">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Öne Çıkan YouTube Videosu"
            ></iframe>
          </div>
        </div>
      )}
      
      {homeSettings.featuredContentType === "text" && homeSettings.textTitle && (
        <div className="w-full max-w-lg p-8 bg-white dark:bg-dark-card rounded-xl shadow-2xl animate-float border border-gray-200 dark:border-dark-border">
          <h3 className="text-2xl font-bold mb-3 text-center">
            {homeSettings.textTitle}
          </h3>
          {homeSettings.textContent && (
            <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed">
              {homeSettings.textContent}
            </p>
          )}
        </div>
      )}
      
      {homeSettings.featuredContentType === "html" && homeSettings.customHtml && (
        <div className="w-full max-w-lg animate-float">
          <ClientOnlyHtml htmlContent={homeSettings.customHtml} />
        </div>
      )}
    </div>
  );
}