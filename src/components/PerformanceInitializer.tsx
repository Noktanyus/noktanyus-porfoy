"use client";

import { useEffect } from 'react';
import { initializePerformanceMonitoring } from '@/lib/performance-monitor';
import { initializeMobileAnimations } from '@/lib/mobile-animations';
import { initializeCSSOptimizations } from '@/lib/css-optimization';

/**
 * Component to initialize performance optimizations
 * This runs on the client side to set up mobile-specific optimizations
 */
const PerformanceInitializer = () => {
  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring();
    
    // Initialize mobile animation optimizations
    initializeMobileAnimations();
    
    // Initialize CSS optimizations
    initializeCSSOptimizations();
    
    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance optimizations initialized');
    }
  }, []);

  // This component doesn't render anything
  return null;
};

export default PerformanceInitializer;