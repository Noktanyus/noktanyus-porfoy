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
      {/* Arka plan dekoratif elementler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-10 left-10 w-20 h-20 bg-blue-200/20 dark:bg-blue-800/10 rounded-full"
          style={{ animation: 'gentle-float 8s ease-in-out infinite' }}
        ></div>
        <div 
          className="absolute bottom-16 right-8 w-16 h-16 bg-purple-200/20 dark:bg-purple-800/10 rounded-full"
          style={{ animation: 'gentle-float 10s ease-in-out infinite 2s' }}
        ></div>
        <div 
          className="absolute top-1/2 left-4 w-12 h-12 bg-green-200/20 dark:bg-green-800/10 rounded-full"
          style={{ animation: 'gentle-float 7s ease-in-out infinite 1s' }}
        ></div>
      </div>

      {videoId && (
        <div 
          className="w-full max-w-lg relative z-10"
          style={{
            animation: 'gentle-float 6s ease-in-out infinite'
          }}
        >
          <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-2xl border-4 border-gray-300 dark:border-gray-700 hover:shadow-3xl hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-1000 ease-out hover:scale-[1.02]">
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
        <div 
          className="w-full max-w-lg p-8 bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border hover:shadow-3xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-1000 ease-out hover:scale-[1.02] relative z-10"
          style={{
            animation: 'gentle-float 6s ease-in-out infinite'
          }}
        >
          <h3 className="text-2xl font-bold mb-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
        <div 
          className="w-full max-w-lg relative z-10 hover:scale-[1.02] transition-transform duration-1000 ease-out"
          style={{
            animation: 'gentle-float 6s ease-in-out infinite'
          }}
        >
          <ClientOnlyHtml html={homeSettings.customHtml} />
        </div>
      )}
    </div>
  );
}