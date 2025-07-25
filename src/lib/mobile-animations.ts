/**
 * Mobile-optimized animation utilities
 * Reduces animation complexity on mobile devices for better performance
 */

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check if device is mobile based on screen size and touch capability
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  const isLowPowerMode = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
  
  return isTouchDevice && (isSmallScreen || isLowPowerMode);
};

// Check if device has limited resources
export const isLowPowerDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) return true;
  
  // Check for hardware concurrency (CPU cores)
  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (hardwareConcurrency && hardwareConcurrency < 4) return true;
  
  // Check for connection type (if available)
  const connection = (navigator as any).connection;
  if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
    return true;
  }
  
  return false;
};

// Animation configuration based on device capabilities
export const getAnimationConfig = () => {
  const reducedMotion = prefersReducedMotion();
  const mobile = isMobileDevice();
  const lowPower = isLowPowerDevice();
  
  if (reducedMotion) {
    return {
      duration: 0,
      easing: 'linear',
      enabled: false,
      useTransform: false,
    };
  }
  
  if (mobile || lowPower) {
    return {
      duration: 150, // Shorter durations for mobile
      easing: 'ease-out',
      enabled: true,
      useTransform: true,
      maxComplexity: 'simple', // Only simple animations
    };
  }
  
  return {
    duration: 300, // Full duration for desktop
    easing: 'ease-in-out',
    enabled: true,
    useTransform: true,
    maxComplexity: 'complex', // Allow complex animations
  };
};

// CSS class generator for mobile-optimized animations
export const getMobileAnimationClasses = (animationType: string): string => {
  const config = getAnimationConfig();
  
  if (!config.enabled) {
    return 'transition-none';
  }
  
  const baseClasses = 'transition-all';
  const durationClass = config.duration <= 150 ? 'duration-150' : 'duration-300';
  const easingClass = config.easing === 'ease-out' ? 'ease-out' : 'ease-in-out';
  
  switch (animationType) {
    case 'fade':
      return `${baseClasses} ${durationClass} ${easingClass}`;
    case 'slide':
      return config.maxComplexity === 'simple' 
        ? `${baseClasses} ${durationClass} ${easingClass}`
        : `${baseClasses} ${durationClass} ${easingClass} transform`;
    case 'scale':
      return config.useTransform 
        ? `${baseClasses} ${durationClass} ${easingClass} transform`
        : `${baseClasses} ${durationClass} ${easingClass}`;
    case 'hover':
      return isMobileDevice() 
        ? 'transition-none' // No hover animations on mobile
        : `${baseClasses} duration-200 ease-out transform`;
    default:
      return `${baseClasses} ${durationClass} ${easingClass}`;
  }
};

// Performance-optimized animation hook
export const useOptimizedAnimation = (element: HTMLElement | null, animationType: string) => {
  if (typeof window === 'undefined' || !element) return;
  
  const config = getAnimationConfig();
  
  if (!config.enabled) {
    // Remove all animation classes if animations are disabled
    element.style.transition = 'none';
    element.style.animation = 'none';
    return;
  }
  
  // Apply mobile-optimized styles
  if (isMobileDevice()) {
    element.style.willChange = 'transform, opacity';
    element.style.backfaceVisibility = 'hidden';
    element.style.webkitBackfaceVisibility = 'hidden';
    element.style.transform = 'translateZ(0)';
    element.style.webkitTransform = 'translateZ(0)';
  }
};

// Intersection Observer for performance-conscious animations
export const createOptimizedIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '10px',
    threshold: 0.1,
    ...options,
  };
  
  // Reduce threshold on mobile for better performance
  if (isMobileDevice()) {
    defaultOptions.threshold = 0.05;
    defaultOptions.rootMargin = '5px';
  }
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Debounced resize handler for mobile optimization
export const createOptimizedResizeHandler = (
  callback: () => void,
  delay: number = 150
) => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      // Only execute callback if not on mobile or if it's a significant resize
      if (!isMobileDevice() || Math.abs(window.innerWidth - window.outerWidth) > 50) {
        callback();
      }
    }, delay);
  };
};

// CSS-in-JS styles for mobile-optimized animations
export const mobileOptimizedStyles = {
  fadeIn: {
    opacity: 0,
    transition: getMobileAnimationClasses('fade'),
    '&.animate': {
      opacity: 1,
    },
  },
  slideUp: {
    transform: 'translateY(10px)',
    opacity: 0,
    transition: getMobileAnimationClasses('slide'),
    '&.animate': {
      transform: 'translateY(0)',
      opacity: 1,
    },
  },
  scaleIn: {
    transform: 'scale(0.95)',
    opacity: 0,
    transition: getMobileAnimationClasses('scale'),
    '&.animate': {
      transform: 'scale(1)',
      opacity: 1,
    },
  },
  hoverLift: {
    transition: getMobileAnimationClasses('hover'),
    '&:hover': isMobileDevice() ? {} : {
      transform: 'translateY(-2px)',
    },
  },
};

// Performance monitoring for animations
export const monitorAnimationPerformance = () => {
  if (typeof window === 'undefined' || !window.performance) return;
  
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.entryType === 'measure' && entry.name.includes('animation')) {
        // Log slow animations on mobile
        if (isMobileDevice() && entry.duration > 16) {
          console.warn(`Slow animation detected: ${entry.name} took ${entry.duration}ms`);
        }
      }
    });
  });
  
  observer.observe({ entryTypes: ['measure'] });
  
  return observer;
};

// Utility to disable animations on low-power devices
export const conditionallyDisableAnimations = () => {
  if (typeof document === 'undefined') return;
  
  if (prefersReducedMotion() || isLowPowerDevice()) {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// Initialize mobile animation optimizations
export const initializeMobileAnimations = () => {
  if (typeof window === 'undefined') return;
  
  // Disable animations if needed
  conditionallyDisableAnimations();
  
  // Start performance monitoring in development
  if (process.env.NODE_ENV === 'development') {
    monitorAnimationPerformance();
  }
  
  // Add mobile-specific CSS custom properties
  if (isMobileDevice()) {
    document.documentElement.style.setProperty('--mobile-animation-duration', '150ms');
    document.documentElement.style.setProperty('--mobile-animation-easing', 'ease-out');
  } else {
    document.documentElement.style.setProperty('--mobile-animation-duration', '300ms');
    document.documentElement.style.setProperty('--mobile-animation-easing', 'ease-in-out');
  }
};