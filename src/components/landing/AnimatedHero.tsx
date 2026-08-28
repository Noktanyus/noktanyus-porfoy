'use client';

import { motion } from 'framer-motion';
import { useInView } from '@/lib/animations';
import Link from 'next/link';
import { FaGithub, FaLinkedin, FaInstagram, FaArrowRight } from 'react-icons/fa';

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
}

export function AnimatedHero({
  name,
  title,
  subtitle,
  description,
  githubUrl,
  linkedinUrl,
  instagramUrl,
  email,
}: HeroProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });

  return (
    <section
      ref={ref}
      className="relative min-h-[80vh] flex items-center overflow-hidden"
      aria-label={`${name} - Hero`}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full bg-purple-400/20 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="container-responsive relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm text-brand-primary font-mono mb-2"
            >
              {subtitle}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4"
            >
              <span className="bg-gradient-to-r from-foreground via-brand-primary to-blue-600 bg-clip-text text-transparent">
                {name}
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl text-muted-foreground mb-6"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-base text-muted-foreground mb-8 max-w-prose"
            >
              {description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href={email ? `/iletisim` : '/iletisim'}
                className="admin-btn admin-btn-primary group"
              >
                İletişime Geç
                <FaArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/projelerim" className="admin-btn admin-btn-secondary">
                Projelerimi Gör
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex gap-4 mt-8"
            >
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-brand-primary transition-colors"
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
                  className="text-muted-foreground hover:text-brand-primary transition-colors"
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
                  className="text-muted-foreground hover:text-brand-primary transition-colors"
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
            className="relative aspect-square max-w-md mx-auto"
          >
            {/* Outer animated ring */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-primary via-blue-500 to-purple-600 opacity-20 animate-spin-slow"
              aria-hidden="true"
            />
            <div
              className="absolute inset-4 rounded-full bg-gradient-to-br from-brand-primary via-blue-500 to-purple-600 opacity-30 blur-xl"
              aria-hidden="true"
            />
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/profile.webp"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default AnimatedHero;
