"use client";
import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import { About, HomeSettings } from "@/types/content";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";
// import { useAnalytics } from "@/hooks/useAnalytics";

interface HeroSectionProps {
  aboutData: About;
  homeSettings: HomeSettings | null;
}

export default function HeroSection({ aboutData, homeSettings }: HeroSectionProps) {
  // const { trackSocialClick } = useAnalytics();

  const handleSocialClick = (platform: string) => {
    // trackSocialClick(platform, 'hero_section');
    console.log('Social click:', platform);
  };
  return (
    <div className={cn("text-center md:text-left")}>
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Profile Image */}
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 flex-shrink-0 scale-in">
          <OptimizedImage
            src={aboutData.profileImage || "/images/profile.webp"}
            alt={`${aboutData.name} - Profil Fotoğrafı`}
            fill
            sizes="(max-width: 768px) 160px, 192px"
            className="rounded-full border-4 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105"
            priority
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        {/* Content */}
        <div className="flex-grow space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-light-text dark:text-dark-text slide-in-left bg-gradient-to-r from-gray-900 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent">
            {aboutData.name}
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-400 slide-in-left" style={{animationDelay: '0.2s'}}>
            {aboutData.title}
          </p>
          
          {/* Description */}
          {aboutData.description && (
            <div className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed slide-in-left" style={{animationDelay: '0.3s'}}>
              <p className="line-clamp-3">{aboutData.description}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start slide-in-left" style={{animationDelay: '0.4s'}}>
            <a
              href="/projelerim"
              className="btn-animated admin-btn admin-btn-primary text-center"
            >
              Projelerimi İncele
            </a>
            <a
              href="/iletisim"
              className="admin-btn admin-btn-secondary text-center"
            >
              İletişime Geç
            </a>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center md:justify-start gap-4 pt-2 slide-in-left" style={{animationDelay: '0.5s'}}>
            <a
              href={aboutData.socialGithub || "#"}
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 rounded-full focus-ring"
              onClick={() => handleSocialClick('github')}
            >
              <FaGithub size={28} />
            </a>
            <a
              href={aboutData.socialLinkedin || "#"}
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 rounded-full focus-ring"
              onClick={() => handleSocialClick('linkedin')}
            >
              <FaLinkedin size={28} />
            </a>
            <a
              href={aboutData.socialInstagram || "#"}
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 rounded-full focus-ring"
              onClick={() => handleSocialClick('instagram')}
            >
              <FaInstagram size={28} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}