/**
 * CSS optimization utilities for mobile performance
 */

// Critical CSS classes that should be inlined
export const criticalCSSClasses = [
  // Layout
  'container',
  'flex',
  'grid',
  'block',
  'hidden',
  'relative',
  'absolute',
  'fixed',
  'sticky',
  
  // Spacing
  'p-4',
  'p-6',
  'px-4',
  'py-4',
  'mx-auto',
  'mb-4',
  'mt-4',
  
  // Typography
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'font-bold',
  'font-semibold',
  'leading-tight',
  
  // Colors
  'text-gray-900',
  'text-white',
  'bg-white',
  'bg-gray-100',
  'dark:bg-dark-bg',
  'dark:text-dark-text',
  
  // Responsive
  'sm:text-lg',
  'md:text-xl',
  'lg:text-2xl',
  'sm:p-6',
  'lg:p-8',
];

// Non-critical CSS classes that can be loaded later
export const nonCriticalCSSClasses = [
  // Animations
  'animate-pulse',
  'animate-spin',
  'animate-bounce',
  'transition-all',
  'duration-300',
  'ease-in-out',
  
  // Complex effects
  'backdrop-blur',
  'shadow-2xl',
  'gradient-to-r',
  'hover:scale-105',
  'group-hover:translate-x-1',
  
  // Advanced responsive
  'xl:text-3xl',
  '2xl:text-4xl',
  'xl:p-10',
  '2xl:p-12',
];

// Generate critical CSS string
export const generateCriticalCSS = (): string => {
  // This would typically be generated at build time
  // For now, return a minimal critical CSS
  return `
    /* Critical CSS for mobile performance */
    .container { width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 1rem; }
    .flex { display: flex; }
    .grid { display: grid; }
    .block { display: block; }
    .hidden { display: none; }
    .relative { position: relative; }
    .absolute { position: absolute; }
    .text-base { font-size: 1rem; line-height: 1.5rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .font-bold { font-weight: 700; }
    .text-gray-900 { color: #111827; }
    .bg-white { background-color: #ffffff; }
    .p-4 { padding: 1rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    
    @media (min-width: 640px) {
      .sm\\:text-lg { font-size: 1.125rem; line-height: 1.75rem; }
      .sm\\:p-6 { padding: 1.5rem; }
    }
    
    @media (min-width: 1024px) {
      .lg\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
      .lg\\:p-8 { padding: 2rem; }
    }
    
    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .dark\\:bg-dark-bg { background-color: #0A0A0A; }
      .dark\\:text-dark-text { color: #EDEDED; }
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `;
};

// Inline critical CSS in document head
export const inlineCriticalCSS = (): void => {
  if (typeof document === 'undefined') return;
  
  const criticalCSS = generateCriticalCSS();
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  style.setAttribute('data-critical', 'true');
  
  // Insert before any existing stylesheets
  const firstLink = document.querySelector('link[rel="stylesheet"]');
  if (firstLink) {
    document.head.insertBefore(style, firstLink);
  } else {
    document.head.appendChild(style);
  }
};

// Load non-critical CSS asynchronously
export const loadNonCriticalCSS = (href: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print'; // Load as print stylesheet initially
    link.onload = () => {
      link.media = 'all'; // Switch to all media once loaded
      resolve();
    };
    link.onerror = reject;
    
    document.head.appendChild(link);
  });
};

// Preload critical resources
export const preloadCriticalResources = (resources: string[]): void => {
  if (typeof document === 'undefined') return;
  
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.match(/\.(woff2?|ttf|otf)$/)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
      link.as = 'image';
    }
    
    link.href = resource;
    document.head.appendChild(link);
  });
};

// Remove unused CSS classes from elements
export const removeUnusedClasses = (element: HTMLElement, usedClasses: string[]): void => {
  const currentClasses = Array.from(element.classList);
  const unusedClasses = currentClasses.filter(cls => !usedClasses.includes(cls));
  
  unusedClasses.forEach(cls => {
    element.classList.remove(cls);
  });
};

// Optimize CSS for mobile viewport
export const optimizeForMobileViewport = (): void => {
  if (typeof document === 'undefined') return;
  
  // Add viewport meta tag if not present
  let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.head.appendChild(viewportMeta);
  }
  
  // Set optimal viewport settings for mobile
  viewportMeta.content = 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no';
  
  // Add mobile-specific meta tags
  const mobileMetaTags = [
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'theme-color', content: '#ffffff' },
    { name: 'msapplication-TileColor', content: '#ffffff' },
  ];
  
  mobileMetaTags.forEach(({ name, content }) => {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  });
};

// CSS custom properties for mobile optimization
export const setCSSCustomProperties = (): void => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Mobile-specific custom properties
  root.style.setProperty('--mobile-safe-area-top', 'env(safe-area-inset-top)');
  root.style.setProperty('--mobile-safe-area-bottom', 'env(safe-area-inset-bottom)');
  root.style.setProperty('--mobile-safe-area-left', 'env(safe-area-inset-left)');
  root.style.setProperty('--mobile-safe-area-right', 'env(safe-area-inset-right)');
  
  // Responsive font sizes
  root.style.setProperty('--font-size-responsive-xs', 'clamp(0.75rem, 2vw, 0.875rem)');
  root.style.setProperty('--font-size-responsive-sm', 'clamp(0.875rem, 2.5vw, 1rem)');
  root.style.setProperty('--font-size-responsive-base', 'clamp(1rem, 3vw, 1.125rem)');
  root.style.setProperty('--font-size-responsive-lg', 'clamp(1.125rem, 3.5vw, 1.25rem)');
  root.style.setProperty('--font-size-responsive-xl', 'clamp(1.25rem, 4vw, 1.5rem)');
  
  // Responsive spacing
  root.style.setProperty('--spacing-responsive-xs', 'clamp(0.25rem, 1vw, 0.5rem)');
  root.style.setProperty('--spacing-responsive-sm', 'clamp(0.5rem, 2vw, 1rem)');
  root.style.setProperty('--spacing-responsive-md', 'clamp(1rem, 3vw, 1.5rem)');
  root.style.setProperty('--spacing-responsive-lg', 'clamp(1.5rem, 4vw, 2rem)');
  root.style.setProperty('--spacing-responsive-xl', 'clamp(2rem, 5vw, 3rem)');
  
  // Animation durations based on device capabilities
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;
  
  if (prefersReducedMotion) {
    root.style.setProperty('--animation-duration-fast', '0ms');
    root.style.setProperty('--animation-duration-normal', '0ms');
    root.style.setProperty('--animation-duration-slow', '0ms');
  } else if (isMobile) {
    root.style.setProperty('--animation-duration-fast', '150ms');
    root.style.setProperty('--animation-duration-normal', '200ms');
    root.style.setProperty('--animation-duration-slow', '300ms');
  } else {
    root.style.setProperty('--animation-duration-fast', '200ms');
    root.style.setProperty('--animation-duration-normal', '300ms');
    root.style.setProperty('--animation-duration-slow', '500ms');
  }
};

// Initialize all CSS optimizations
export const initializeCSSOptimizations = (): void => {
  // Inline critical CSS
  inlineCriticalCSS();
  
  // Optimize for mobile viewport
  optimizeForMobileViewport();
  
  // Set CSS custom properties
  setCSSCustomProperties();
  
  // Preload critical resources - geçici olarak devre dışı
  // preloadCriticalResources([
  //   '/images/placeholder.webp',
  // ]);
  
  // Load non-critical CSS after page load - geçici olarak devre dışı
  // if (typeof window !== 'undefined') {
  //   window.addEventListener('load', () => {
  //     // Load additional stylesheets asynchronously
  //     loadNonCriticalCSS('/css/animations.css').catch(console.warn);
  //     loadNonCriticalCSS('/css/utilities.css').catch(console.warn);
  //   });
  // }
};

// CSS minification utility (for build time)
export const minifyCSS = (css: string): string => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
    .replace(/\s*{\s*/g, '{') // Remove spaces around braces
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*,\s*/g, ',') // Remove spaces around commas
    .replace(/\s*:\s*/g, ':') // Remove spaces around colons
    .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
    .trim();
};

// Generate responsive image CSS
export const generateResponsiveImageCSS = (): string => {
  return minifyCSS(`
    .responsive-image {
      width: 100%;
      height: auto;
      object-fit: cover;
      transition: transform var(--animation-duration-normal) ease-out;
    }
    
    .responsive-image-container {
      position: relative;
      overflow: hidden;
      border-radius: 0.5rem;
    }
    
    @media (hover: hover) {
      .responsive-image-container:hover .responsive-image {
        transform: scale(1.05);
      }
    }
    
    @media (max-width: 640px) {
      .responsive-image {
        transition: none;
      }
      
      .responsive-image-container:hover .responsive-image {
        transform: none;
      }
    }
    
    .responsive-image-placeholder {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    @media (prefers-reduced-motion: reduce) {
      .responsive-image-placeholder {
        animation: none;
        background: #f0f0f0;
      }
    }
  `);
};