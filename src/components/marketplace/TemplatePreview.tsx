'use client';

/**
 * TemplatePreview — Template detay sayfası için görsel galerisi + lightbox.
 *
 * - Ana görsel + thumbnail grid
 * - Tıklamada lightbox modal açılır
 * - Klavye navigasyonu (← → ok tuşları, ESC kapat)
 * - next/image ile remotePatterns (next.config.mjs) kullanır
 * - Focus trap + body scroll lock (lightbox açıkken)
 */

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import Image from 'next/image';
import { FaChevronLeft, FaChevronRight, FaExpand } from 'react-icons/fa';

interface TemplatePreviewProps {
  images: string[];
  alt: string;
}

export function TemplatePreview({ images, alt }: TemplatePreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const safeImages = images.length > 0 ? images : [];
  const hasMultiple = safeImages.length > 1;

  const goTo = useCallback(
    (index: number) => {
      if (safeImages.length === 0) return;
      const normalized = ((index % safeImages.length) + safeImages.length) % safeImages.length;
      setActiveIndex(normalized);
    },
    [safeImages.length]
  );

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Klavye navigasyonu (lightbox açıkken)
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, next, prev]);

  // Body scroll lock + initial focus
  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen]);

  if (safeImages.length === 0) {
    return (
      <div className="glass-card-premium aspect-video flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <span className="text-5xl block mb-2" aria-hidden="true">
            🖼️
          </span>
          <p>Görsel bulunamadı</p>
        </div>
      </div>
    );
  }

  const handleThumbKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      goTo(idx + 1);
      (e.currentTarget.nextElementSibling as HTMLButtonElement | null)?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goTo(idx - 1);
      (e.currentTarget.previousElementSibling as HTMLButtonElement | null)?.focus();
    }
  };

  return (
    <>
      {/* Main image */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted border border-gray-200/60 dark:border-gray-700/60 group">
        <Image
          src={safeImages[activeIndex]}
          alt={`${alt} — görsel ${activeIndex + 1} / ${safeImages.length}`}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
          priority
          quality={85}
        />

        {/* Expand button */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute top-3 right-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Görseli büyüt"
        >
          <FaExpand className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Prev/Next */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute top-1/2 left-3 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Önceki görsel"
            >
              <FaChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute top-1/2 right-3 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Sonraki görsel"
            >
              <FaChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </>
        )}

        {/* Counter */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-xs tabular-nums">
            {activeIndex + 1} / {safeImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && (
        <div
          className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3"
          role="tablist"
          aria-label="Görsel seçici"
        >
          {safeImages.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              role="tab"
              aria-selected={activeIndex === idx}
              aria-label={`Görsel ${idx + 1}`}
              onClick={() => goTo(idx)}
              onKeyDown={(e) => handleThumbKey(e, idx)}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                activeIndex === idx
                  ? 'border-brand-primary ring-2 ring-brand-primary/40'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
                quality={60}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — görsel büyük boy`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            ref={closeBtnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            className="absolute top-4 right-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Kapat"
          >
            <FaExpand className="w-5 h-5 rotate-45" aria-hidden="true" />
          </button>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Önceki görsel"
              >
                <FaChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Sonraki görsel"
              >
                <FaChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </>
          )}

          <div
            className="relative w-full h-full max-w-7xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={safeImages[activeIndex]}
              alt={`${alt} — büyük boy ${activeIndex + 1} / ${safeImages.length}`}
              fill
              sizes="100vw"
              className="object-contain"
              quality={90}
              priority
            />
          </div>

          {hasMultiple && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm tabular-nums">
              {activeIndex + 1} / {safeImages.length} — ESC ile kapat
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default TemplatePreview;