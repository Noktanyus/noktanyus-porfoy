"use client";

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA, trackPageView, analytics } from '@/lib/analytics';

function AnalyticsCore({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize GA4 on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  // Track scroll depth
  useEffect(() => {
    let maxScroll = 0;
    const trackScrollDepth = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      // Track at 25%, 50%, 75%, 100% milestones
      const milestones = [25, 50, 75, 100];
      const currentMilestone = milestones.find(m => scrollPercent >= m && m > maxScroll);
      
      if (currentMilestone) {
        maxScroll = currentMilestone;
        analytics.scrollDepth(currentMilestone);
      }
    };

    const throttledTrackScroll = throttle(trackScrollDepth, 1000);
    window.addEventListener('scroll', throttledTrackScroll);
    
    return () => window.removeEventListener('scroll', throttledTrackScroll);
  }, [pathname]);

  // Track time on page
  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent > 10) { // Only track if user spent more than 10 seconds
        analytics.timeOnPage(timeSpent, pathname);
      }
    };
  }, [pathname]);

  // Track errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analytics.error(event.message, event.filename || pathname);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.error(String(event.reason), pathname);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [pathname]);

  return <>{children}</>;
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <AnalyticsCore>{children}</AnalyticsCore>
    </Suspense>
  );
}

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean;
  return (function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}