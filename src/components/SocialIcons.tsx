"use client";

import { useState, useEffect } from 'react';
import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';

interface SocialIconsProps {
  github?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  size?: number;
}

export default function SocialIcons({ github, linkedin, instagram, size = 28 }: SocialIconsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex justify-center md:justify-start space-x-6">
        {github && (
          <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded" />
        )}
        {linkedin && (
          <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded" />
        )}
        {instagram && (
          <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded" />
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center md:justify-start space-x-6">
      {github && (
        <a
          href={github}
          aria-label="GitHub"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaGithub size={size} />
        </a>
      )}
      {linkedin && (
        <a
          href={linkedin}
          aria-label="LinkedIn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaLinkedin size={size} />
        </a>
      )}
      {instagram && (
        <a
          href={instagram}
          aria-label="Instagram"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram size={size} />
        </a>
      )}
    </div>
  );
}