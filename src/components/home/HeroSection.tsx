"use client";

import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import { About } from "@/types/content";
import OptimizedImage from "@/components/ui/OptimizedImage";
import Image from "next/image";

interface HeroSectionProps {
  aboutData: About;
}

export default function HeroSection({ aboutData }: HeroSectionProps) {
  return (
    <div className="text-center md:text-left fade-in animate-float-bubble">
      <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10">
        {/* Profile Image - Mobile-first sizing with better responsive scaling */}
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 flex-shrink-0 slide-in-left stagger-1">
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
        
        {/* Content - More compact text hierarchy and spacing */}
        <div className="flex-grow space-y-3 sm:space-y-4 md:space-y-5 slide-in-right stagger-2">
          {/* Name - Smaller, more balanced typography scaling */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-light-text dark:text-dark-text text-hover-glow">
            {aboutData.name}
          </h1>
          
          {/* Title - More moderate responsive text sizing */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            {aboutData.title}
          </p>
          
          {/* Social Icons - Touch-friendly with proper spacing */}
          <div className="flex justify-center md:justify-start gap-4 sm:gap-5 md:gap-6 pt-2 scale-in stagger-3">
            <a
              href={aboutData.socialGithub || "#"}
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover-bounce mobile-touch"
            >
              <FaGithub className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" />
            </a>
            <a
              href={aboutData.socialLinkedin || "#"}
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover-bounce mobile-touch"
            >
              <FaLinkedin className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" />
            </a>
            <a
              href={aboutData.socialInstagram || "#"}
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover-bounce mobile-touch"
            >
              <FaInstagram className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}