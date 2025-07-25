"use client";

import Image from 'next/image';
import { useState } from 'react';
import { useLazyLoading } from '@/hooks/useLazyLoading';

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
  quality = 75,
  loading = 'lazy',
  unoptimized = false,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Use optimized lazy loading hook
  const { ref: imgRef, hasIntersected } = useLazyLoading({
    rootMargin: '50px',
    threshold: 0.1,
    skip: priority,
  });

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (
    fill 
      ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      : width && height
        ? `(max-width: 640px) ${Math.min(width, 640)}px, (max-width: 1024px) ${Math.min(width, 1024)}px, ${width}px`
        : "100vw"
  );

  // Generate blur placeholder for better loading experience
  const generateBlurDataURL = (w: number = 10, h: number = 10) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Don't render image until it's in view (unless priority)
  if (!hasIntersected && !priority) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          aspectRatio: width && height ? `${width}/${height}` : undefined,
          ...style,
        }}
      />
    );
  }

  // Error state
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
    <div ref={imgRef} className={`relative ${!isLoaded ? 'animate-pulse' : ''}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={responsiveSizes}
        priority={priority}
        quality={quality}
        loading={loading}
        unoptimized={unoptimized}
        placeholder={placeholder}
        blurDataURL={blurDataURL || (typeof window !== 'undefined' ? generateBlurDataURL() : undefined)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      )}
    </div>
  );
};

export default OptimizedImage;