/**
 * Performance monitoring utilities for mobile optimization
 */

interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

interface DeviceInfo {
  isMobile: boolean;
  isLowPower: boolean;
  connectionType: string;
  deviceMemory: number;
  hardwareConcurrency: number;
}

// Get device information for performance optimization
export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isLowPower: false,
      connectionType: 'unknown',
      deviceMemory: 4,
      hardwareConcurrency: 4,
    };
  }

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const connection = (navigator as any).connection;
  
  return {
    isMobile: isTouchDevice && isSmallScreen,
    isLowPower: deviceMemory < 4 || hardwareConcurrency < 4,
    connectionType: connection?.effectiveType || 'unknown',
    deviceMemory,
    hardwareConcurrency,
  };
};

// Monitor Core Web Vitals
export const monitorCoreWebVitals = (): void => {
  if (typeof window === 'undefined' || !window.performance) return;

  // Largest Contentful Paint (LCP)
  const observeLCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry) {
        const lcp = lastEntry.startTime;
        // console.log(`LCP: ${lcp}ms`); // Console filter ile zaten filtreleniyor
        
        // Log warning if LCP is poor on mobile
        const deviceInfo = getDeviceInfo();
        if (deviceInfo.isMobile && lcp > 2500) {
          console.warn(`Poor LCP on mobile: ${lcp}ms (target: <2500ms)`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  };

  // First Input Delay (FID)
  const observeFID = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fid = entry.processingStart - entry.startTime;
        console.log(`FID: ${fid}ms`);
        
        if (fid > 100) {
          console.warn(`Poor FID: ${fid}ms (target: <100ms)`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['first-input'] });
  };

  // Cumulative Layout Shift (CLS)
  const observeCLS = () => {
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      console.log(`CLS: ${clsValue}`);
      
      if (clsValue > 0.1) {
        // console.warn(`Poor CLS: ${clsValue} (target: <0.1)`); // Console filter ile zaten filtreleniyor
      }
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  };

  // Initialize observers
  observeLCP();
  observeFID();
  observeCLS();
};

// Monitor image loading performance
export const monitorImagePerformance = (): void => {
  if (typeof window === 'undefined') return;

  const imageObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.name.includes('image') || entry.name.includes('.jpg') || 
          entry.name.includes('.png') || entry.name.includes('.webp')) {
        
        const loadTime = entry.responseEnd - entry.startTime;
        // console.log(`Image load time: ${entry.name} - ${loadTime}ms`); // Console filter ile zaten filtreleniyor
        
        // Warn about slow image loading on mobile
        const deviceInfo = getDeviceInfo();
        if (deviceInfo.isMobile && loadTime > 1000) {
          console.warn(`Slow image loading on mobile: ${entry.name} - ${loadTime}ms`);
        }
      }
    });
  });
  
  imageObserver.observe({ entryTypes: ['resource'] });
};

// Monitor animation performance
export const monitorAnimationPerformance = (): void => {
  if (typeof window === 'undefined') return;

  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 0;

  const measureFPS = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      
      // Warn about low FPS on mobile
      const deviceInfo = getDeviceInfo();
      if (deviceInfo.isMobile && fps < 30) {
        console.warn(`Low FPS on mobile: ${fps} (target: >30fps)`);
      }
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
  };
  
  requestAnimationFrame(measureFPS);
};

// Monitor memory usage
export const monitorMemoryUsage = (): void => {
  if (typeof window === 'undefined' || !(performance as any).memory) return;

  const checkMemory = () => {
    const memory = (performance as any).memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
    const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
    
    // console.log(`Memory usage: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`); // Console filter ile zaten filtreleniyor
    
    // Warn about high memory usage
    const usagePercentage = (usedMB / limitMB) * 100;
    if (usagePercentage > 80) {
      console.warn(`High memory usage: ${usagePercentage.toFixed(1)}%`);
    }
  };
  
  // Check memory usage every 30 seconds
  setInterval(checkMemory, 30000);
  checkMemory(); // Initial check
};

// Optimize performance based on device capabilities
export const optimizeForDevice = (): void => {
  const deviceInfo = getDeviceInfo();
  
  if (deviceInfo.isLowPower || deviceInfo.isMobile) {
    // Reduce animation complexity
    document.documentElement.style.setProperty('--animation-duration', '150ms');
    document.documentElement.style.setProperty('--animation-easing', 'ease-out');
    
    // Disable complex effects
    const style = document.createElement('style');
    style.textContent = `
      .backdrop-blur { backdrop-filter: none !important; }
      .shadow-2xl { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
      .group:hover .group-hover\\:scale-105 { transform: none !important; }
    `;
    document.head.appendChild(style);
  }
  
  if (deviceInfo.connectionType === 'slow-2g' || deviceInfo.connectionType === '2g') {
    // Disable non-essential animations and effects
    const style = document.createElement('style');
    style.textContent = `
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      .animate-pulse { animation: none !important; opacity: 0.7; }
    `;
    document.head.appendChild(style);
  }
};

// Preload critical resources based on device capabilities
export const preloadCriticalResources = (): void => {
  if (typeof document === 'undefined') return;
  
  const deviceInfo = getDeviceInfo();
  
  // Only preload essential resources on low-power devices
  const resources = deviceInfo.isLowPower 
    ? ['/images/placeholder.webp']
    : [
        '/images/placeholder.webp',
        '/images/profile.webp',
        // '/fonts/inter-var.woff2', // Google Fonts kullanıldığı için kaldırıldı
      ];
  
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    if (resource.endsWith('.webp') || resource.endsWith('.jpg') || resource.endsWith('.png')) {
      link.as = 'image';
    } else if (resource.endsWith('.woff2') || resource.endsWith('.woff')) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    }
    
    link.href = resource;
    document.head.appendChild(link);
  });
};

// Initialize all performance monitoring
export const initializePerformanceMonitoring = (): void => {
  if (typeof window === 'undefined') return;
  
  // Only enable detailed monitoring in development
  if (process.env.NODE_ENV === 'development') {
    monitorCoreWebVitals();
    monitorImagePerformance();
    monitorAnimationPerformance();
    monitorMemoryUsage();
  }
  
  // Always optimize for device capabilities
  optimizeForDevice();
  // preloadCriticalResources(); // Geçici olarak devre dışı - font preload hatası nedeniyle
};

// Report performance metrics
export const reportPerformanceMetrics = (): PerformanceMetrics | null => {
  if (typeof window === 'undefined' || !window.performance) return null;
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    lcp: 0, // Will be populated by observer
    fid: 0, // Will be populated by observer
    cls: 0, // Will be populated by observer
    fcp: navigation.responseStart - navigation.fetchStart,
    ttfb: navigation.responseStart - navigation.requestStart,
  };
};

// Lazy load non-critical JavaScript
export const lazyLoadNonCriticalJS = (): void => {
  if (typeof window === 'undefined') return;
  
  const deviceInfo = getDeviceInfo();
  
  // Only load non-critical JS on capable devices
  if (!deviceInfo.isLowPower && deviceInfo.connectionType !== 'slow-2g') {
    // Load analytics, social widgets, etc. after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        // Example: Load analytics
        // loadScript('/js/analytics.js');
        
        // Example: Load social widgets
        // loadScript('/js/social-widgets.js');
      }, 2000);
    });
  }
};

// Utility to load scripts asynchronously
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};