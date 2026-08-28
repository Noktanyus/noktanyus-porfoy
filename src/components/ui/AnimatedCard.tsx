'use client';

import { motion } from 'framer-motion';
import { useInView } from '@/lib/animations';
import type { Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type CardVariant = 'fadeUp' | 'scaleIn' | 'slideLeft' | 'slideRight';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: CardVariant;
  /** IntersectionObserver threshold (0-1) */
  threshold?: number;
}

const variantsMap: Record<CardVariant, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  },
  slideRight: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  },
};

export function AnimatedCard({
  children,
  className = '',
  delay = 0,
  variant = 'fadeUp',
  threshold = 0.1,
}: AnimatedCardProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={variantsMap[variant]}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedGridProps {
  children: ReactNode;
  className?: string;
  /** Her çocuk arasındaki gecikme (ms) */
  staggerMs?: number;
  /** İlk animasyon başlamadan önceki gecikme (ms) */
  delayMs?: number;
}

export function AnimatedGrid({
  children,
  className = '',
  staggerMs = 100,
  delayMs = 100,
}: AnimatedGridProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.05 });

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerMs / 1000,
        delayChildren: delayMs / 1000,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={container}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedCard;
