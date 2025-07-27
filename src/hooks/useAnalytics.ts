"use client";

import { useCallback } from 'react';
import { analytics, ecommerce } from '@/lib/analytics';

/**
 * Custom hook for easy analytics tracking
 */
export const useAnalytics = () => {
  // Project tracking
  const trackProjectView = useCallback((slug: string, title: string) => {
    analytics.projectView(slug, title);
    ecommerce.viewItem(slug, title, 'project');
  }, []);

  const trackProjectDemo = useCallback((slug: string) => {
    analytics.projectLiveDemo(slug);
  }, []);

  const trackProjectGithub = useCallback((slug: string) => {
    analytics.projectGithub(slug);
  }, []);

  // Blog tracking
  const trackBlogView = useCallback((slug: string, title: string) => {
    analytics.blogView(slug, title);
    ecommerce.viewItem(slug, title, 'blog');
  }, []);

  const trackBlogShare = useCallback((slug: string, platform: string) => {
    analytics.blogShare(slug, platform);
  }, []);

  // Contact tracking
  const trackContactSubmit = useCallback((success: boolean) => {
    analytics.contactFormSubmit(success);
  }, []);

  const trackContactField = useCallback((fieldName: string) => {
    analytics.contactFormField(fieldName);
  }, []);

  // Social tracking
  const trackSocialClick = useCallback((platform: string, location: string) => {
    analytics.socialClick(platform, location);
  }, []);

  // Navigation tracking
  const trackLinkClick = useCallback((url: string, text: string) => {
    analytics.linkClick(url, text);
  }, []);

  // Search tracking
  const trackSearch = useCallback((query: string, results: number) => {
    analytics.search(query, results);
  }, []);

  // Download tracking
  const trackDownload = useCallback((fileName: string, fileType: string) => {
    analytics.download(fileName, fileType);
  }, []);

  // Theme tracking
  const trackThemeChange = useCallback((theme: string) => {
    analytics.themeChange(theme);
  }, []);

  // Performance tracking
  const trackPerformance = useCallback((metric: string, value: number) => {
    analytics.performanceMetric(metric, value);
  }, []);

  // Generic event tracking
  const trackEvent = useCallback((
    action: string,
    category: string,
    label?: string,
    value?: number,
    customParameters?: Record<string, any>
  ) => {
    if (typeof window !== 'undefined') {
      analytics.pageView(window.location.href); // Ensure page context
    }
    // Use the generic trackEvent from analytics
    import('@/lib/analytics').then(({ trackEvent: genericTrack }) => {
      genericTrack(action, category, label, value, customParameters);
    });
  }, []);

  return {
    // Project methods
    trackProjectView,
    trackProjectDemo,
    trackProjectGithub,
    
    // Blog methods
    trackBlogView,
    trackBlogShare,
    
    // Contact methods
    trackContactSubmit,
    trackContactField,
    
    // Social methods
    trackSocialClick,
    
    // Navigation methods
    trackLinkClick,
    
    // Search methods
    trackSearch,
    
    // Download methods
    trackDownload,
    
    // Theme methods
    trackThemeChange,
    
    // Performance methods
    trackPerformance,
    
    // Generic event tracking
    trackEvent,
  };
};