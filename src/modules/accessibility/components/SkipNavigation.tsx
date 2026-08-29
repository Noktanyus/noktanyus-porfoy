"use client";

/**
 * @file Skip Navigation Component
 * @description Sayfa içinde anchor link'lere atlamayı sağlayan skip nav.
 *              Klavye kullanıcıları için ilk tab'da görünür hale gelir.
 *              WCAG 2.2 — Bypass Blocks (SC 2.4.1)
 */

import { useEffect, useState } from "react";

interface SkipLink {
  href: string;
  label: string;
}

interface SkipNavigationProps {
  links?: SkipLink[];
  className?: string;
}

const DEFAULT_LINKS: SkipLink[] = [
  { href: "#main-content", label: "Ana içeriğe geç" },
  { href: "#main-nav", label: "Navigasyona geç" },
];

export function SkipNavigation({
  links = DEFAULT_LINKS,
  className = "",
}: SkipNavigationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") setVisible(true);
    };
    const onMouseDown = () => setVisible(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  return (
    <nav
      aria-label="Skip navigation"
      className={`fixed top-0 left-0 z-[100] p-2 ${className}`}
    >
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          tabIndex={1}
          className={`
            block px-4 py-2 mr-2 mb-1 rounded-lg
            bg-primary text-primary-foreground font-medium text-sm shadow-lg
            transition-transform duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
            ${visible
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0 pointer-events-none"
            }
          `}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}