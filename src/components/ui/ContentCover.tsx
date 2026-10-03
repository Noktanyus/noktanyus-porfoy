'use client';

import React from 'react';
import {
  FaCode,
  FaLayerGroup,
  FaServer,
  FaTerminal,
  FaDatabase,
  FaMobileAlt,
  FaLaptopCode,
  FaPalette,
  FaCloud,
} from 'react-icons/fa';

interface ContentCoverProps {
  title: string;
  category?: string;
  tags?: string[];
  type?: 'blog' | 'project' | 'product';
  isLive?: boolean;
  className?: string;
}

interface ThemeConfig {
  gradient: string;
  accent: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function getTheme(category?: string, title: string = '', type: string = 'blog'): ThemeConfig {
  const normalized = `${category || ''} ${title}`.toLowerCase();

  if (normalized.includes('react') || normalized.includes('next.js') || normalized.includes('nextjs')) {
    return {
      gradient: 'from-slate-950 via-slate-900 to-sky-950',
      accent: 'border-sky-500/30',
      glow: 'bg-sky-500/15',
      badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      badgeText: 'text-sky-300',
      Icon: FaCode,
    };
  }

  if (normalized.includes('ui') || normalized.includes('tasarım') || normalized.includes('glass') || normalized.includes('css') || normalized.includes('tailwind')) {
    return {
      gradient: 'from-slate-950 via-purple-950 to-violet-950',
      accent: 'border-purple-500/30',
      glow: 'bg-purple-500/15',
      badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      badgeText: 'text-purple-300',
      Icon: FaPalette,
    };
  }

  if (normalized.includes('database') || normalized.includes('prisma') || normalized.includes('drizzle') || normalized.includes('sql') || normalized.includes('veri')) {
    return {
      gradient: 'from-slate-950 via-emerald-950 to-teal-950',
      accent: 'border-emerald-500/30',
      glow: 'bg-emerald-500/15',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      badgeText: 'text-emerald-300',
      Icon: FaDatabase,
    };
  }

  if (normalized.includes('docker') || normalized.includes('devops') || normalized.includes('cloud') || normalized.includes('sunucu') || normalized.includes('container')) {
    return {
      gradient: 'from-slate-950 via-blue-950 to-indigo-950',
      accent: 'border-blue-500/30',
      glow: 'bg-blue-500/15',
      badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      badgeText: 'text-blue-300',
      Icon: FaCloud,
    };
  }

  if (normalized.includes('mobil') || normalized.includes('app') || normalized.includes('react native') || normalized.includes('expo')) {
    return {
      gradient: 'from-slate-950 via-rose-950 to-pink-950',
      accent: 'border-rose-500/30',
      glow: 'bg-rose-500/15',
      badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      badgeText: 'text-rose-300',
      Icon: FaMobileAlt,
    };
  }

  if (normalized.includes('api') || normalized.includes('tr') || normalized.includes('ödeme') || normalized.includes('stripe') || normalized.includes('paytr')) {
    return {
      gradient: 'from-slate-950 via-indigo-950 to-cyan-950',
      accent: 'border-cyan-500/30',
      glow: 'bg-cyan-500/15',
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      badgeText: 'text-cyan-300',
      Icon: FaServer,
    };
  }

  return {
    gradient: 'from-slate-950 via-slate-900 to-indigo-950',
    accent: 'border-indigo-500/30',
    glow: 'bg-indigo-500/15',
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    badgeText: 'text-indigo-300',
    Icon: type === 'project' ? FaLaptopCode : FaTerminal,
  };
}

export function ContentCover({
  title,
  category,
  tags = [],
  type = 'blog',
  isLive,
  className = '',
}: ContentCoverProps) {
  const theme = getTheme(category, title, type);
  const Icon = theme.Icon;
  const displayCategory = category || (type === 'project' ? 'PROJE' : 'GELİŞTİRİCİ');

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br ${theme.gradient} flex flex-col justify-between p-5 sm:p-6 select-none ${className}`}
      aria-label={`${title} kapak görseli`}
    >
      {/* Background ambient radial glows */}
      <div
        className={`absolute -top-12 -left-12 w-48 h-48 rounded-full ${theme.glow} blur-2xl pointer-events-none`}
        aria-hidden="true"
      />
      <div
        className={`absolute -bottom-10 -right-10 w-56 h-56 rounded-full ${theme.glow} blur-3xl pointer-events-none`}
        aria-hidden="true"
      />

      {/* Subtle geometric dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* macOS-style mini window dots */}
          <div className="flex items-center gap-1.5 opacity-60">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border backdrop-blur-md ${theme.badgeBg}`}
          >
            <Icon className="w-3 h-3" />
            <span>{displayCategory}</span>
          </span>
        </div>

        {isLive && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Canlı
          </span>
        )}
      </div>

      {/* Center Graphic & Abstract Code Silhouette */}
      <div className="relative z-10 my-auto py-2">
        {/* Subtle decorative code editor silhouette lines */}
        <div className="space-y-1.5 opacity-40 max-w-[80%] mb-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-12 rounded-full bg-sky-400" />
            <span className="h-1.5 w-24 rounded-full bg-white/40" />
            <span className="h-1.5 w-16 rounded-full bg-indigo-400" />
          </div>
          <div className="flex items-center gap-2 pl-4">
            <span className="h-1.5 w-28 rounded-full bg-emerald-400/80" />
            <span className="h-1.5 w-16 rounded-full bg-white/30" />
          </div>
        </div>

        <h4 className="text-lg sm:text-xl font-extrabold text-white leading-snug line-clamp-2 drop-shadow-md">
          {title}
        </h4>
      </div>

      {/* Bottom Footer Details */}
      <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
        <span className="font-mono text-[11px] tracking-wide text-white/50">
          // noktanyus.com
        </span>

        {tags.length > 0 && (
          <div className="flex items-center gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentCover;
