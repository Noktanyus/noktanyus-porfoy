'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from '@/lib/animations';
import Link from 'next/link';
import { FaGithub, FaLinkedin, FaInstagram, FaArrowRight, FaBolt, FaTools } from 'react-icons/fa';
import { DS } from '@/lib/design-system';

interface HeroProps {
  name: string;
  title: string;
  subtitle: string;
  description: string;
  githubUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  /** E-posta (Iletisim linki) */
  email?: string;
  /** Profil görseli yolu */
  profileImage?: string;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'YT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Hero’da uzun biyografi yerine okunabilir kısa özet. */
function shortenDescription(text: string, maxChars = 220): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxChars) return cleaned;
  const cut = cleaned.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function AnimatedHero({
  name,
  title,
  subtitle,
  description,
  githubUrl,
  linkedinUrl,
  instagramUrl,
  profileImage = '/images/profile.webp',
}: HeroProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.12 });
  const initials = initialsFromName(name);
  const shortDescription = shortenDescription(description);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      ref={ref}
      className="relative min-h-[min(88vh,820px)] flex items-center overflow-x-clip pt-4 sm:pt-6"
      aria-label={`${name} - Hero`}
    >
      {/* Full-bleed ambient plane */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_70%_10%,oklch(var(--primary)/0.22),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_80%,oklch(var(--primary)/0.10),transparent_65%)]" />

        <motion.div
          className="absolute top-10 -left-20 w-[22rem] h-[22rem] rounded-full bg-brand-primary/25 blur-3xl"
          animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-28 right-0 w-[32rem] h-[32rem] rounded-full bg-sky-400/20 blur-3xl"
          animate={{ x: [0, -36, 0], y: [0, 28, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-cyan-400/12 blur-3xl"
          animate={{ x: [0, 18, 0], y: [0, 24, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div
        className="absolute inset-x-0 -bottom-1 h-40 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="container-responsive relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-16 items-center"
        >
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-wrap items-center gap-2 mb-4"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Aktif olarak geliştiriyorum
              </span>
              <span className="text-xs font-mono tracking-wide text-slate-500 dark:text-slate-400">
                {subtitle}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.18 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-3 leading-[1.05] tracking-tight text-foreground"
            >
              <span className="bg-gradient-to-r from-slate-900 via-brand-primary to-sky-600 dark:from-white dark:via-sky-100 dark:to-sky-400 bg-clip-text text-transparent">
                {name}
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.28 }}
              className="text-xl sm:text-2xl text-slate-700 dark:text-slate-200 mb-5 font-semibold"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.36 }}
              className="text-base sm:text-[1.05rem] text-slate-600 dark:text-slate-300 mb-8 max-w-xl leading-relaxed"
            >
              {shortDescription}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.44 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/magaza" className={`${DS.button.primary} px-6 group`}>
                API & Mağaza
                <FaArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link href="/projelerim" className={`${DS.button.secondary} px-6 border border-border`}>
                Projelerimi Gör
              </Link>
              <Link
                href="/iletisim"
                className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-primary transition-colors"
              >
                İletişime Geç
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-6 flex flex-wrap gap-2"
            >
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-brand-primary/40 hover:text-brand-primary transition-colors"
              >
                <FaBolt className="h-3 w-3" aria-hidden="true" />
                API Docs
              </Link>
              <Link
                href="/araclar"
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-brand-primary/40 hover:text-brand-primary transition-colors"
              >
                <FaTools className="h-3 w-3" aria-hidden="true" />
                Canlı Araçlar
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="flex gap-3 mt-8"
            >
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border text-slate-600 dark:text-slate-300 hover:text-brand-primary hover:border-brand-primary/40 transition-colors"
                  aria-label="GitHub"
                >
                  <FaGithub className="w-5 h-5" />
                </a>
              )}
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border text-slate-600 dark:text-slate-300 hover:text-brand-primary hover:border-brand-primary/40 transition-colors"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="w-5 h-5" />
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border text-slate-600 dark:text-slate-300 hover:text-brand-primary hover:border-brand-primary/40 transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-[300px] sm:max-w-sm"
          >
            <div
              className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-primary/30 via-sky-500/15 to-transparent blur-2xl"
              aria-hidden="true"
            />

            <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shadow-brand-primary/25 bg-gradient-to-br from-slate-800 via-slate-900 to-brand-primary/80">
              {!imageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImage}
                  alt={`${name} profil fotoğrafı`}
                  className="w-full h-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-brand-primary to-sky-600"
                  aria-hidden="true"
                >
                  <span className="text-6xl sm:text-7xl font-extrabold text-white tracking-wide drop-shadow-lg">
                    {initials}
                  </span>
                  <span className="mt-2 text-sm font-medium text-white/80">{title}</span>
                </div>
              )}

              <div
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent pointer-events-none"
                aria-hidden="true"
              />
            </div>

            <div className="absolute -bottom-3 left-4 right-4 sm:left-6 sm:right-6 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-md px-4 py-3 shadow-xl">
              <p className="text-[11px] uppercase tracking-[0.16em] text-sky-300/90 font-semibold mb-1">
                Noktanyus
              </p>
              <p className="text-sm text-white font-medium leading-snug">
                Portföy · TR API · Canlı araçlar
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default AnimatedHero;
