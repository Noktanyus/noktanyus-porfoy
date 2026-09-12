'use client';

import { motion } from 'framer-motion';
import { useInView } from '@/lib/animations';
import Link from 'next/link';
import { FaGithub, FaLinkedin, FaInstagram, FaArrowRight } from 'react-icons/fa';
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
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  const initials = initialsFromName(name);

  return (
    <section
      ref={ref}
      className="relative min-h-[min(80vh,720px)] flex items-center overflow-hidden pt-6 sm:pt-8"
      aria-label={`${name} - Hero`}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-brand-primary/20 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 rounded-full bg-sky-400/15 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full bg-cyan-400/10 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="container-responsive relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center"
        >
          <div>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm text-brand-primary font-mono mb-3 tracking-wide"
            >
              {subtitle}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 leading-[1.1]"
            >
              <span className="bg-gradient-to-r from-foreground via-brand-primary to-sky-500 bg-clip-text text-transparent">
                {name}
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl sm:text-2xl text-muted-foreground mb-5 font-medium"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-base text-muted-foreground mb-8 max-w-prose leading-relaxed"
            >
              {description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/iletisim" className={`${DS.button.primary} px-6 group`}>
                İletişime Geç
                <FaArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link href="/projelerim" className={`${DS.button.secondary} px-6 border border-border`}>
                Projelerimi Gör
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex gap-3 mt-8"
            >
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border text-muted-foreground hover:text-brand-primary hover:border-brand-primary/40 transition-colors"
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
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border text-muted-foreground hover:text-brand-primary hover:border-brand-primary/40 transition-colors"
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
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border text-muted-foreground hover:text-brand-primary hover:border-brand-primary/40 transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
            className="relative aspect-square max-w-[280px] sm:max-w-sm mx-auto w-full"
          >
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-primary via-sky-500 to-cyan-400 opacity-25 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-background shadow-2xl shadow-brand-primary/20 bg-gradient-to-br from-slate-800 to-brand-primary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profileImage}
                alt={`${name} profil fotoğrafı`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.hidden = false;
                }}
              />
              <div
                hidden
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 via-brand-primary to-sky-600"
                aria-hidden="true"
              >
                <span className="text-5xl sm:text-6xl font-bold text-white tracking-wide">{initials}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default AnimatedHero;
