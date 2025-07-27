/**
 * Google Analytics 4 integration
 */

// GA4 Measurement ID
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Check if GA is enabled
export const isGAEnabled = !!GA_MEASUREMENT_ID && process.env.NODE_ENV === 'production';

// Initialize GA4
export const initGA = () => {
  if (!isGAEnabled) return;

  // Load gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true,
  });

  // Make gtag globally available
  (window as any).gtag = gtag;
};

// Page view tracking
export const trackPageView = (url: string, title?: string) => {
  if (!isGAEnabled || typeof window === 'undefined') return;

  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('config', GA_MEASUREMENT_ID, {
      page_title: title || document.title,
      page_location: url,
      send_page_view: true,
    });
  }
};

// Event tracking
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number,
  customParameters?: Record<string, any>
) => {
  if (!isGAEnabled || typeof window === 'undefined') return;

  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParameters,
    });
  }
};

// Predefined event tracking functions
export const analytics = {
  // Page events
  pageView: (url: string, title?: string) => trackPageView(url, title),
  
  // Navigation events
  linkClick: (url: string, text: string) => 
    trackEvent('click', 'navigation', `${text} -> ${url}`),
  
  // Project events
  projectView: (projectSlug: string, projectTitle: string) =>
    trackEvent('view', 'project', projectSlug, undefined, { project_title: projectTitle }),
  
  projectLiveDemo: (projectSlug: string) =>
    trackEvent('click', 'project', 'live_demo', undefined, { project_slug: projectSlug }),
  
  projectGithub: (projectSlug: string) =>
    trackEvent('click', 'project', 'github', undefined, { project_slug: projectSlug }),
  
  // Blog events
  blogView: (blogSlug: string, blogTitle: string) =>
    trackEvent('view', 'blog', blogSlug, undefined, { blog_title: blogTitle }),
  
  blogShare: (blogSlug: string, platform: string) =>
    trackEvent('share', 'blog', platform, undefined, { blog_slug: blogSlug }),
  
  // Contact events
  contactFormSubmit: (success: boolean) =>
    trackEvent('submit', 'contact', success ? 'success' : 'error'),
  
  contactFormField: (fieldName: string) =>
    trackEvent('focus', 'contact_form', fieldName),
  
  // Social events
  socialClick: (platform: string, location: string) =>
    trackEvent('click', 'social', platform, undefined, { location }),
  
  // Search events
  search: (query: string, results: number) =>
    trackEvent('search', 'site', query, results),
  
  // Download events
  download: (fileName: string, fileType: string) =>
    trackEvent('download', 'file', fileName, undefined, { file_type: fileType }),
  
  // Theme events
  themeChange: (theme: string) =>
    trackEvent('change', 'theme', theme),
  
  // Performance events
  performanceMetric: (metric: string, value: number) =>
    trackEvent('performance', 'metric', metric, value),
  
  // Error events
  error: (errorMessage: string, errorLocation: string) =>
    trackEvent('error', 'javascript', errorMessage, undefined, { location: errorLocation }),
  
  // Engagement events
  scrollDepth: (percentage: number) =>
    trackEvent('scroll', 'engagement', `${percentage}%`, percentage),
  
  timeOnPage: (seconds: number, page: string) =>
    trackEvent('timing', 'engagement', page, seconds),
};

// Enhanced ecommerce events (for future use)
export const ecommerce = {
  // View item (project/blog)
  viewItem: (itemId: string, itemName: string, category: string, value?: number) => {
    if (!isGAEnabled) return;
    
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', 'view_item', {
        currency: 'USD',
        value: value || 0,
        items: [{
          item_id: itemId,
          item_name: itemName,
          item_category: category,
          quantity: 1,
        }]
      });
    }
  },
  
  // Select content
  selectContent: (contentType: string, itemId: string) => {
    if (!isGAEnabled) return;
    
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', 'select_content', {
        content_type: contentType,
        item_id: itemId,
      });
    }
  },
};

// User properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (!isGAEnabled || typeof window === 'undefined') return;

  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('config', GA_MEASUREMENT_ID, {
      custom_map: properties,
    });
  }
};

// Consent management
export const updateConsent = (consentSettings: {
  analytics_storage?: 'granted' | 'denied';
  ad_storage?: 'granted' | 'denied';
}) => {
  if (!isGAEnabled || typeof window === 'undefined') return;

  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('consent', 'update', consentSettings);
  }
};

// Debug mode
export const enableDebugMode = () => {
  if (!isGAEnabled || typeof window === 'undefined') return;

  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('config', GA_MEASUREMENT_ID, {
      debug_mode: true,
    });
  }
};