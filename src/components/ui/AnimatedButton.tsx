'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { FaArrowRight } from 'react-icons/fa';

interface AnimatedButtonProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  showArrow?: boolean;
  external?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * @file AnimatedButton - Hover lift, aktif basma ve ikon kayma animasyonları.
 */
export function AnimatedButton({
  href,
  children,
  variant = 'primary',
  showArrow = false,
  external = false,
  className = '',
  ariaLabel,
}: AnimatedButtonProps) {
  const baseClass =
    'group relative inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary';

  const variantClass =
    variant === 'primary'
      ? 'bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-primary/30'
      : 'bg-muted text-foreground hover:bg-muted/80';

  const classes = `${baseClass} ${variantClass} ${className}`.trim();

  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      {showArrow && (
        <FaArrowRight
          className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        aria-label={ariaLabel}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {inner}
    </Link>
  );
}

export default AnimatedButton;
