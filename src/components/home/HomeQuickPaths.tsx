'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaBolt, FaStore, FaTools, FaFolderOpen, FaArrowRight } from 'react-icons/fa';
import { useInView } from '@/lib/animations';

const PATHS = [
  {
    href: '/docs',
    title: 'API Docs',
    description: 'TR yardımcı API uçlarını inceleyin, örnek isteklerle başlayın.',
    icon: FaBolt,
    accent: 'from-sky-500/20 to-blue-600/10 text-sky-400 border-sky-500/25',
  },
  {
    href: '/araclar',
    title: 'Canlı Araçlar',
    description: 'IBAN, TCKN/VKN, KDV ve iş günü araçlarını ücretsiz deneyin.',
    icon: FaTools,
    accent: 'from-emerald-500/20 to-teal-600/10 text-emerald-400 border-emerald-500/25',
  },
  {
    href: '/magaza',
    title: 'Mağaza',
    description: 'Aylık plan veya kredi ile API kotanızı hemen açın.',
    icon: FaStore,
    accent: 'from-amber-500/20 to-orange-600/10 text-amber-400 border-amber-500/25',
  },
  {
    href: '/projelerim',
    title: 'Projeler',
    description: 'Üretimde çalışan ürünler ve teknik detaylar.',
    icon: FaFolderOpen,
    accent: 'from-blue-500/20 to-indigo-600/10 text-blue-400 border-blue-500/25',
  },
] as const;

export default function HomeQuickPaths() {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.12 });

  return (
    <section
      ref={ref}
      className="py-4 sm:py-6"
      aria-labelledby="home-quick-paths-title"
    >
      <div className="mb-6 sm:mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary mb-2">
          Nereden başlayalım?
        </p>
        <h2
          id="home-quick-paths-title"
          className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight"
        >
          Tek bakışta yol haritası
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Portföy, ücretsiz araçlar ve TR yardımcı API — ihtiyacınıza göre doğru kapıya gidin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {PATHS.map((path, index) => {
          const Icon = path.icon;
          return (
            <motion.div
              key={path.href}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.08 * index, ease: 'easeOut' }}
            >
              <Link
                href={path.href}
                className="group relative flex h-full flex-col rounded-2xl border border-border/80 bg-card/70 dark:bg-slate-900/50 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-lg hover:shadow-brand-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br ${path.accent}`}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-brand-primary transition-colors">
                  {path.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                  {path.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
                  Keşfet
                  <FaArrowRight
                    className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
