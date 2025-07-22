"use client";

import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import Image from "next/image";
import { About } from "@/types/content";

interface HeroSectionProps {
  aboutData: About;
}

export default function HeroSection({ aboutData }: HeroSectionProps) {
  return (
    <div className="text-center md:text-left">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
          <Image
            src={aboutData.profileImage || "/images/profile.webp"}
            alt={`${aboutData.name} - Profil Fotoğrafı`}
            fill
            sizes="(max-width: 768px) 128px, 160px"
            style={{ objectFit: "cover" }}
            className="rounded-full border-4 border-gray-200 dark:border-gray-700 shadow-lg"
            priority
          />
        </div>
        <div className="flex-grow">
          <h1 className="text-4xl md:text-6xl font-bold mb-2 text-light-text dark:text-dark-text">
            {aboutData.name}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-6">
            {aboutData.title}
          </p>
          <div className="flex justify-center md:justify-start space-x-6">
            <a
              href={aboutData.socialGithub || "#"}
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub size={28} />
            </a>
            <a
              href={aboutData.socialLinkedin || "#"}
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin size={28} />
            </a>
            <a
              href={aboutData.socialInstagram || "#"}
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram size={28} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}