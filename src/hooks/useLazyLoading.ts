"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadingOptions {
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  skip?: boolean;
}

interface UseLazyLoadingReturn {
  ref: React.RefObject<HTMLElement>;
  isIntersecting: boolean;
  hasIntersected: boolean;
}

/**
 * Custom hook for lazy loading with Intersection Observer
 * Optimized for mobile performance
 */
export const useLazyLoading = (options: UseLazyLoadingOptions = {}): UseLazyLoadingReturn => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true,
    skip = false,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(skip);
  const [hasIntersected, setHasIntersected] = useState(skip);
  const ref = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (skip || !ref.current) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isCurrentlyIntersecting = entry.isIntersecting;
          
          setIsIntersecting(isCurrentlyIntersecting);
          
          if (isCurrentlyIntersecting && !hasIntersected) {
            setHasIntersected(true);
            
            if (triggerOnce) {
              cleanup();
            }
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (ref.current) {
      observerRef.current.observe(ref.current);
    }

    return cleanup;
  }, [rootMargin, threshold, triggerOnce, skip, hasIntersected, cleanup]);

  return {
    ref,
    isIntersecting,
    hasIntersected,
  };
};

/**
 * Hook for lazy loading images with preloading
 */
export const useLazyImage = (src: string, options: UseLazyLoadingOptions = {}) => {
  const { ref, isIntersecting, hasIntersected } = useLazyLoading(options);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasIntersected || !src || isLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setError('Failed to load image');
      setIsLoading(false);
    };
    
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [hasIntersected, src, isLoaded, isLoading]);

  return {
    ref,
    isIntersecting,
    hasIntersected,
    isLoaded,
    isLoading,
    error,
  };
};

/**
 * Hook for lazy loading with batch processing
 * Useful for loading multiple items efficiently
 */
export const useBatchLazyLoading = <T>(
  items: T[],
  batchSize: number = 5,
  options: UseLazyLoadingOptions = {}
) => {
  const { ref, hasIntersected } = useLazyLoading(options);
  const [loadedBatches, setLoadedBatches] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNextBatch = useCallback(() => {
    if (isLoading || loadedBatches * batchSize >= items.length) return;

    setIsLoading(true);
    
    // Simulate async loading (replace with actual loading logic)
    setTimeout(() => {
      setLoadedBatches(prev => prev + 1);
      setIsLoading(false);
    }, 100);
  }, [isLoading, loadedBatches, batchSize, items.length]);

  useEffect(() => {
    if (hasIntersected && loadedBatches === 0) {
      loadNextBatch();
    }
  }, [hasIntersected, loadedBatches, loadNextBatch]);

  const visibleItems = items.slice(0, loadedBatches * batchSize);
  const hasMore = loadedBatches * batchSize < items.length;

  return {
    ref,
    visibleItems,
    hasMore,
    isLoading,
    loadNextBatch,
    progress: Math.min((loadedBatches * batchSize) / items.length, 1),
  };
};

/**
 * Hook for progressive image loading with multiple sizes
 */
export const useProgressiveImage = (
  lowQualitySrc: string,
  highQualitySrc: string,
  options: UseLazyLoadingOptions = {}
) => {
  const { ref, hasIntersected } = useLazyLoading(options);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLowQualityLoaded, setIsLowQualityLoaded] = useState(false);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (!hasIntersected) return;

    // Load low quality image first
    const lowQualityImg = new Image();
    lowQualityImg.onload = () => {
      setCurrentSrc(lowQualitySrc);
      setIsLowQualityLoaded(true);
      
      // Then load high quality image
      const highQualityImg = new Image();
      highQualityImg.onload = () => {
        setCurrentSrc(highQualitySrc);
        setIsHighQualityLoaded(true);
      };
      highQualityImg.src = highQualitySrc;
    };
    lowQualityImg.src = lowQualitySrc;
  }, [hasIntersected, lowQualitySrc, highQualitySrc]);

  return {
    ref,
    src: currentSrc,
    isLowQualityLoaded,
    isHighQualityLoaded,
    isLoading: hasIntersected && !isLowQualityLoaded,
  };
};

/**
 * Hook for lazy loading with retry mechanism
 */
export const useLazyLoadingWithRetry = (
  loadFunction: () => Promise<void>,
  maxRetries: number = 3,
  retryDelay: number = 1000,
  options: UseLazyLoadingOptions = {}
) => {
  const { ref, hasIntersected } = useLazyLoading(options);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const attemptLoad = useCallback(async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await loadFunction();
      setIsLoaded(true);
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Loading failed';
      setError(errorMessage);
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setIsLoading(false);
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      }
    } finally {
      if (retryCount >= maxRetries) {
        setIsLoading(false);
      }
    }
  }, [loadFunction, isLoaded, isLoading, retryCount, maxRetries, retryDelay]);

  useEffect(() => {
    if (hasIntersected && !isLoaded && !isLoading) {
      attemptLoad();
    }
  }, [hasIntersected, isLoaded, isLoading, attemptLoad]);

  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(0);
      setError(null);
      attemptLoad();
    }
  }, [retryCount, maxRetries, attemptLoad]);

  return {
    ref,
    isLoading,
    error,
    isLoaded,
    retryCount,
    canRetry: retryCount < maxRetries,
    retry,
  };
};