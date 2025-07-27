"use client";
import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import { About, HomeSettings } from "@/types/content";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useAnalytics";

interface HeroSectionProps {
  aboutData: About;
  homeSettings: HomeSettings | null;
}

export default function HeroSection({ aboutData, homeSettings }: HeroSectionProps) {
  const { trackSocialClick } = useAnalytics();

  const handleSocialClick = (platform: string) => {
    trackSocialClick(platform, 'hero_section');
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
          
          {/* Social Icons */}
          <div className="flex justify-center md:justify-start gap-5 pt-3 slide-in-left" style={{animationDelay: '0.4s'}}>
            <a
              href={aboutData.socialGithub || "#"}
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 p-2 rounded-full"
              onClick={() => handleSocialClick('github')}
            >
              <FaGithub size={32} />
            </a>
            <a
              href={aboutData.socialLinkedin || "#"}
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 p-2 rounded-full"
              onClick={() => handleSocialClick('linkedin')}
            >
              <FaLinkedin size={32} />
            </a>
            <a
              href={aboutData.socialInstagram || "#"}
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 p-2 rounded-full"
              onClick={() => handleSocialClick('instagram')}
            >
              <FaInstagram size={32} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}