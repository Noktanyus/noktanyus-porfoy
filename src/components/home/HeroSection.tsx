"use client";

import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import { About } from "@/types/content";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface HeroSectionProps {
  aboutData: About;
}

export default function HeroSection({ aboutData }: HeroSectionProps) {
  return (
    <div className="text-center md:text-left">
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12">
        {/* Profile Image - Mobile-first sizing with better responsive scaling */}
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 flex-shrink-0">
          <OptimizedImage
            src={aboutData.profileImage || "/images/profile.webp"}
            alt={`${aboutData.name} - Profil Fotoğrafı`}
            fill
            sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, (max-width: 1024px) 176px, 192px"
            style={{ objectFit: "cover" }}
            className="rounded-full border-4 border-gray-200 dark:border-gray-700 shadow-lg"
            priority
            quality={90}
          />
        </div>
        
        {/* Content - Improved text hierarchy and spacing */}
        <div className="flex-grow space-y-4 sm:space-y-5 md:space-y-6">
          {/* Name - Better mobile-first typography scaling */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-light-text dark:text-dark-text">
            {aboutData.name}
          </h1>
          
          {/* Title - Improved responsive text sizing */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed">
            {aboutData.title}
          </p>
          
          {/* Social Icons - Touch-friendly with proper spacing */}
          <div className="flex justify-center md:justify-start gap-4 sm:gap-5 md:gap-6 pt-2">
            <a
              href={aboutData.socialGithub || "#"}
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <FaGithub className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" />
            </a>
            <a
              href={aboutData.socialLinkedin || "#"}
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <FaLinkedin className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" />
            </a>
            <a
              href={aboutData.socialInstagram || "#"}
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <FaInstagram className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}