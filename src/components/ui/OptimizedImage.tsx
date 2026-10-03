"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
}

// Basit gri blur placeholder (SSR-uyumlu, sabit değer)
const DEFAULT_BLUR_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  className = '',
  style,
  onLoad,
  onError,
  placeholder = 'empty',
  blurDataURL,
  quality = 80,
  loading = 'lazy',
  unoptimized = false,
}: OptimizedImageProps) => {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);

  // priority true ise loading'i 'eager' yap
  const imageLoading = priority ? 'eager' : loading;

  // src prop'u değiştiğinde currentSrc'yi güncelle
  useEffect(() => {
    if (src !== currentSrc) {
      setSrc(src);
      setHasError(false);
    }
  }, [src, currentSrc]);

  // Responsive sizes - fill veya boyut bilgisine göre
  const responsiveSizes = sizes || (
    fill
      ? "(max-width: 320px) 320px, (max-width: 640px) 640px, (max-width: 1024px) 50vw, 33vw"
      : width && height
        ? `(max-width: 320px) 320px, (max-width: 640px) ${Math.min(width, 640)}px, (max-width: 1024px) ${Math.min(width, 1024)}px, ${width}px`
        : "(max-width: 320px) 320px, (max-width: 640px) 640px, 100vw"
  );

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    if (currentSrc !== "/images/placeholder.webp") {
      setSrc("/images/placeholder.webp");
    } else {
      setHasError(true);
    }
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 flex flex-col items-center justify-center border border-white/10 ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          aspectRatio: width && height ? `${width}/${height}` : undefined,
          ...style,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,oklch(var(--primary)/0.15),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-primary backdrop-blur-sm shadow-md">
            <span className="font-mono text-sm font-bold">&lt;/&gt;</span>
          </div>
          <span className="text-xs font-medium text-slate-300 drop-shadow-sm max-w-[85%] truncate">
            {alt || 'Görsel'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      sizes={responsiveSizes}
      priority={priority}
      quality={quality}
      loading={imageLoading}
      unoptimized={unoptimized}
      placeholder={placeholder}
      blurDataURL={blurDataURL || DEFAULT_BLUR_DATA_URL}
      className={className}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default OptimizedImage;
