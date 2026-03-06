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
    onLoad?.();
  };

  const handleError = () => {
    if (currentSrc !== "/images/profile.webp") {
      setSrc("/images/profile.webp");
    } else {
      setHasError(true);
    }
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          aspectRatio: width && height ? `${width}/${height}` : undefined,
          ...style,
        }}
      >
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
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
