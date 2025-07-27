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
    <div className="relative flex items-center justify-center min-h-[300px] p-4">
      {/* Arka plan dekoratif elementler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/20 dark:bg-blue-800/10 rounded-full floating-element"></div>
        <div className="absolute bottom-16 right-8 w-16 h-16 bg-purple-200/20 dark:bg-purple-800/10 rounded-full floating-element" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-1/2 left-4 w-12 h-12 bg-green-200/20 dark:bg-green-800/10 rounded-full floating-element" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Video Content */}
      {videoId && (
        <div className="w-full max-w-lg relative z-10 scale-in">
          <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-gray-300 dark:border-gray-700 hover:shadow-blue-500/20 transition-all duration-300">
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
      
      {/* Text Content */}
      {homeSettings.featuredContentType === "text" && homeSettings.textTitle && (
        <div className="w-full max-w-lg admin-card relative z-10 scale-in text-center">
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {homeSettings.textTitle}
          </h3>
          {homeSettings.textContent && (
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              {homeSettings.textContent}
            </p>
          )}
          <div className="flex justify-center gap-3">
            <a href="/projelerim" className="admin-btn admin-btn-primary">
              Projelerim
            </a>
            <a href="/blog" className="admin-btn admin-btn-secondary">
              Blog
            </a>
          </div>
        </div>
      )}
      
      {/* HTML Content */}
      {homeSettings.featuredContentType === "html" && homeSettings.customHtml && (
        <div className="w-full max-w-lg relative z-10 scale-in">
          <div className="admin-card">
            <ClientOnlyHtml html={homeSettings.customHtml} />
          </div>
        </div>
      )}
      
      {/* Default Content when no settings */}
      {!homeSettings.featuredContentType && (
        <div className="w-full max-w-lg admin-card relative z-10 scale-in text-center">
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hoş Geldiniz!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            Portföyümde projelerimi, blog yazılarımı ve deneyimlerimi keşfedebilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a href="/projelerim" className="admin-btn admin-btn-primary">
              Projelerimi İncele
            </a>
            <a href="/blog" className="admin-btn admin-btn-secondary">
              Blog Yazılarım
            </a>
          </div>
        </div>
      )}
    </div>
  );
}