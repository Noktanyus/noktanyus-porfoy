"use client";

import { useState, useEffect } from 'react';
import { FaChevronUp } from 'react-icons/fa';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Sayfa kaydırıldığında butonu göster/gizle
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 bg-brand-primary text-white p-3 sm:p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-110 active:scale-95 animate-fade-in focus:outline-none focus:ring-4 focus:ring-blue-500/20"
      aria-label="Yukarı Çık"
    >
      <FaChevronUp className="text-xl sm:text-2xl" />
    </button>
  );
}
