import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        // Enhanced mobile-first breakpoints
        'xs': '360px',        // Small mobile devices
        'sm': '640px',        // Large mobile devices
        'md': '768px',        // Tablets
        'lg': '1024px',       // Small desktops
        'xl': '1280px',       // Large desktops
        '2xl': '1536px',      // Extra large desktops
        '3xl': '1600px',      // Ultra wide screens
        
        // Custom responsive breakpoints for better mobile experience
        'mobile-xs': '320px',  // Very small mobile (iPhone SE)
        'mobile-sm': '375px',  // Standard mobile (iPhone 12)
        'mobile-md': '390px',  // Larger mobile (iPhone 12 Pro)
        'mobile-lg': '414px',  // Large mobile (iPhone 12 Pro Max)
        'tablet-sm': '768px',  // Small tablet (iPad)
        'tablet-md': '834px',  // Medium tablet (iPad Air)
        'tablet-lg': '1024px', // Large tablet (iPad Pro)
        'desktop': '1280px',   // Standard desktop
        'desktop-lg': '1440px', // Large desktop
        'desktop-xl': '1920px', // Extra large desktop
        'desktop-2xl': '2560px', // Ultra-wide desktop
        
        // Specific device breakpoints
        'iphone-se': '375px',
        'iphone-12': '390px',
        'iphone-12-pro-max': '428px',
        'ipad': '768px',
        'ipad-air': '820px',
        'ipad-pro': '1024px',
        'macbook': '1280px',
        'imac': '1440px',
        'imac-pro': '1920px',
        
        // Orientation-based breakpoints
        'landscape': { 'raw': '(orientation: landscape)' },
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape-mobile': { 'raw': '(orientation: landscape) and (max-width: 768px)' },
        'portrait-mobile': { 'raw': '(orientation: portrait) and (max-width: 768px)' },
        
        // Touch and hover capabilities
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
        'can-hover': { 'raw': '(hover: hover)' },
        
        // High DPI screens
        'retina': { 'raw': '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)' },
        
        // Reduced motion preference
        'reduce-motion': { 'raw': '(prefers-reduced-motion: reduce)' },
        'motion-ok': { 'raw': '(prefers-reduced-motion: no-preference)' },
      },
      colors: {
        "brand-primary": "#0078D4",
        // Vercel'den ilham alan yeni renkler
        "light-bg": "#FFFFFF", // Aydınlık mod arka planı (saf beyaz)
        "light-text": "#111827", // Aydınlık mod metin (koyu gri)
        "dark-bg": "#0A0A0A",   // Karanlık mod arka planı (siyaha yakın)
        "dark-text": "#EDEDED", // Karanlık mod metin (açık gri)
        "dark-card": "#121212", // Karanlık mod kart arka planı
        "dark-border": "#262626", // Karanlık mod kenarlık
      },
      
      // ===== KEYFRAMES FOR ANIMATIONS =====
      keyframes: {
        // Floating animation for hero section
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        // Fade in animation
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // Scale in animation
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        // Slide in from left
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        // Slide in from right
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        // Glow animation
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4)' },
        },
      },
      
      // ===== ANIMATION UTILITIES =====
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      spacing: {
        // Enhanced spacing scale for better mobile experience
        '0.5': '0.125rem',    // 2px
        '1.5': '0.375rem',    // 6px
        '2.5': '0.625rem',    // 10px
        '3.5': '0.875rem',    // 14px
        '4.5': '1.125rem',    // 18px
        '5.5': '1.375rem',    // 22px
        '6.5': '1.625rem',    // 26px
        '7.5': '1.875rem',    // 30px
        '8.5': '2.125rem',    // 34px
        '9.5': '2.375rem',    // 38px
        '11': '2.75rem',      // 44px - Minimum touch target
        '13': '3.25rem',      // 52px
        '15': '3.75rem',      // 60px
        '17': '4.25rem',      // 68px
        '18': '4.5rem',       // 72px
        '19': '4.75rem',      // 76px
        '21': '5.25rem',      // 84px
        '22': '5.5rem',       // 88px
        '26': '6.5rem',       // 104px
        '28': '7rem',         // 112px
        '30': '7.5rem',       // 120px
        '34': '8.5rem',       // 136px
        '36': '9rem',         // 144px
        '44': '11rem',        // 176px
        '52': '13rem',        // 208px
        '60': '15rem',        // 240px
        '68': '17rem',        // 272px
        '76': '19rem',        // 304px
        '84': '21rem',        // 336px
        '88': '22rem',        // 352px
        '92': '23rem',        // 368px
        '96': '24rem',        // 384px
        '104': '26rem',       // 416px
        '112': '28rem',       // 448px
        '128': '32rem',       // 512px
        '144': '36rem',       // 576px
        '160': '40rem',       // 640px
        '176': '44rem',       // 704px
        '192': '48rem',       // 768px
        '208': '52rem',       // 832px
        '224': '56rem',       // 896px
        '240': '60rem',       // 960px
        '256': '64rem',       // 1024px
        
        // Mobile-specific spacing
        'mobile-xs': '0.25rem',  // 4px
        'mobile-sm': '0.5rem',   // 8px
        'mobile-md': '0.75rem',  // 12px
        'mobile-lg': '1rem',     // 16px
        'mobile-xl': '1.5rem',   // 24px
        'mobile-2xl': '2rem',    // 32px
        
        // Touch target sizes
        'touch-sm': '2.75rem',   // 44px - Minimum
        'touch-md': '3rem',      // 48px - Comfortable
        'touch-lg': '3.5rem',    // 56px - Large
      },
      maxWidth: {
        // Enhanced max-width scale for responsive containers
        '8xl': '88rem',       // 1408px
        '9xl': '96rem',       // 1536px
        '10xl': '104rem',     // 1664px
        '11xl': '112rem',     // 1792px
        
        // Content-specific max widths
        'prose-sm': '60ch',   // Small prose content
        'prose-md': '65ch',   // Medium prose content
        'prose-lg': '70ch',   // Large prose content
        'prose-xl': '75ch',   // Extra large prose content
        
        // Mobile-specific max widths
        'mobile': '100vw',    // Full mobile width
        'mobile-content': '90vw', // Mobile content with padding
        
        // Container max widths for different breakpoints
        'container-xs': '20rem',    // 320px
        'container-sm': '24rem',    // 384px
        'container-md': '28rem',    // 448px
        'container-lg': '32rem',    // 512px
        'container-xl': '36rem',    // 576px
        'container-2xl': '42rem',   // 672px
        'container-3xl': '48rem',   // 768px
        'container-4xl': '56rem',   // 896px
        'container-5xl': '64rem',   // 1024px
        'container-6xl': '72rem',   // 1152px
        'container-7xl': '80rem',   // 1280px
      },
      
      minWidth: {
        // Minimum widths for responsive components
        '0': '0px',
        'xs': '20rem',        // 320px
        'sm': '24rem',        // 384px
        'md': '28rem',        // 448px
        'lg': '32rem',        // 512px
        'xl': '36rem',        // 576px
        '2xl': '42rem',       // 672px
        '3xl': '48rem',       // 768px
        'mobile': '20rem',    // 320px - Minimum mobile width
        'tablet': '48rem',    // 768px - Minimum tablet width
        'desktop': '64rem',   // 1024px - Minimum desktop width
        
        // Touch target minimum widths
        'touch': '2.75rem',   // 44px
        'touch-lg': '3.5rem', // 56px
      },
      
      minHeight: {
        // Minimum heights for responsive components
        '0': '0px',
        'screen-mobile': '100vh',
        'screen-tablet': '100vh',
        'screen-desktop': '100vh',
        'touch': '2.75rem',   // 44px - Minimum touch target
        'touch-lg': '3.5rem', // 56px - Large touch target
        'hero-mobile': '60vh',
        'hero-tablet': '70vh',
        'hero-desktop': '80vh',
      },
      
      aspectRatio: {
        // Enhanced aspect ratios for responsive images and components
        'auto': 'auto',
        'square': '1 / 1',
        'video': '16 / 9',
        'cinema': '21 / 9',
        'photo': '4 / 3',
        'portrait': '3 / 4',
        'golden': '1.618 / 1',
        'card': '5 / 3',
        'banner': '3 / 1',
        'hero': '2 / 1',
        'mobile-hero': '4 / 3',
        'tablet-hero': '3 / 2',
        'desktop-hero': '5 / 2',
        
        // Social media aspect ratios
        'instagram': '1 / 1',
        'instagram-story': '9 / 16',
        'facebook-cover': '820 / 312',
        'twitter-header': '3 / 1',
        'linkedin-banner': '4 / 1',
        
        // Device aspect ratios
        'mobile-portrait': '9 / 16',
        'mobile-landscape': '16 / 9',
        'tablet-portrait': '3 / 4',
        'tablet-landscape': '4 / 3',
        'desktop-standard': '16 / 10',
        'desktop-wide': '21 / 9',
        
        // Content-specific aspect ratios
        'blog-card': '16 / 10',
        'project-card': '4 / 3',
        'gallery-thumb': '1 / 1',
        'hero-mobile': '4 / 5',
        'hero-tablet': '3 / 2',
        'hero-desktop': '5 / 2',
        'avatar': '1 / 1',
        'cover-photo': '3 / 1',
        
        // Responsive aspect ratios (will be handled by utilities)
        'responsive-card': 'var(--aspect-ratio-card)',
        'responsive-hero': 'var(--aspect-ratio-hero)',
        'responsive-image': 'var(--aspect-ratio-image)',
      },
      fontSize: {
        // Enhanced responsive typography with better mobile scaling
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '7xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '8xl': ['6rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '9xl': ['8rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        
        // Mobile-optimized typography
        'mobile-xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.025em' }], // 11px
        'mobile-sm': ['0.8125rem', { lineHeight: '1.125rem', letterSpacing: '0.025em' }], // 13px
        'mobile-base': ['0.9375rem', { lineHeight: '1.375rem', letterSpacing: '0' }], // 15px
        'mobile-lg': ['1.0625rem', { lineHeight: '1.5rem', letterSpacing: '-0.025em' }], // 17px
        'mobile-xl': ['1.1875rem', { lineHeight: '1.625rem', letterSpacing: '-0.025em' }], // 19px
        
        // Heading scales for different screen sizes
        'heading-mobile-sm': ['1.125rem', { lineHeight: '1.375rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'heading-mobile-md': ['1.25rem', { lineHeight: '1.5rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'heading-mobile-lg': ['1.5rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em', fontWeight: '700' }],
        'heading-mobile-xl': ['1.875rem', { lineHeight: '2rem', letterSpacing: '-0.025em', fontWeight: '700' }],
        
        'heading-tablet-sm': ['1.25rem', { lineHeight: '1.5rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'heading-tablet-md': ['1.5rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'heading-tablet-lg': ['1.875rem', { lineHeight: '2.125rem', letterSpacing: '-0.025em', fontWeight: '700' }],
        'heading-tablet-xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em', fontWeight: '700' }],
        
        'heading-desktop-sm': ['1.5rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'heading-desktop-md': ['1.875rem', { lineHeight: '2.125rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'heading-desktop-lg': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em', fontWeight: '700' }],
        'heading-desktop-xl': ['3rem', { lineHeight: '3.25rem', letterSpacing: '-0.025em', fontWeight: '700' }],
        
        // Responsive display typography
        'display-mobile': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em', fontWeight: '800' }],
        'display-tablet': ['3rem', { lineHeight: '3.25rem', letterSpacing: '-0.025em', fontWeight: '800' }],
        'display-desktop': ['4.5rem', { lineHeight: '4.75rem', letterSpacing: '-0.025em', fontWeight: '800' }],
        
        // Responsive body text
        'body-mobile-xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'body-mobile-sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0' }],
        'body-mobile-md': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'body-mobile-lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        
        'body-tablet-xs': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'body-tablet-sm': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'body-tablet-md': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
        'body-tablet-lg': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.025em' }],
        
        'body-desktop-xs': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.025em' }],
        'body-desktop-sm': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
        'body-desktop-md': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '0' }],
        'body-desktop-lg': ['1.375rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
        
        // Caption and small text
        'caption-mobile': ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.025em' }],
        'caption-tablet': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'caption-desktop': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
      },
      boxShadow: {
        // Enhanced shadows for responsive design
        "card-light": "0 4px 14px 0 rgba(0, 0, 0, 0.05)",
        "card-dark": "0 4px 14px 0 rgba(0, 0, 0, 0.25)",
        
        // Mobile-optimized shadows (lighter for performance)
        "mobile-xs": "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        "mobile-sm": "0 2px 6px 0 rgba(0, 0, 0, 0.1)",
        "mobile-md": "0 2px 8px 0 rgba(0, 0, 0, 0.1)",
        "mobile-lg": "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
        "mobile-xl": "0 6px 16px 0 rgba(0, 0, 0, 0.1)",
        
        // Mobile dark mode shadows
        "mobile-dark-xs": "0 1px 3px 0 rgba(0, 0, 0, 0.3)",
        "mobile-dark-sm": "0 2px 6px 0 rgba(0, 0, 0, 0.3)",
        "mobile-dark-md": "0 2px 8px 0 rgba(0, 0, 0, 0.3)",
        "mobile-dark-lg": "0 4px 12px 0 rgba(0, 0, 0, 0.3)",
        "mobile-dark-xl": "0 6px 16px 0 rgba(0, 0, 0, 0.3)",
        
        // Touch interaction shadows
        "touch-active": "0 1px 2px 0 rgba(0, 0, 0, 0.2)",
        "touch-hover": "0 2px 4px 0 rgba(0, 0, 0, 0.15)",
        
        // Responsive elevation system
        "elevation-1": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "elevation-2": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "elevation-3": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "elevation-4": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "elevation-5": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        
        // Focus shadows for accessibility
        "focus-ring": "0 0 0 3px rgba(59, 130, 246, 0.5)",
        "focus-ring-dark": "0 0 0 3px rgba(147, 197, 253, 0.5)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"), 
    require("tailwindcss-animate"), 
    require("@tailwindcss/aspect-ratio"),
    // Custom plugin for responsive utilities
    function({ addUtilities, theme, addComponents }: { addUtilities: any, theme: any, addComponents: any }) {
      // Add responsive container utilities
      addComponents({
        // ===== LAYOUT COMPONENTS =====
        '.container-responsive': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            maxWidth: theme('screens.sm'),
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen md': {
            maxWidth: theme('screens.md'),
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
          '@screen lg': {
            maxWidth: theme('screens.lg'),
            paddingLeft: theme('spacing.10'),
            paddingRight: theme('spacing.10'),
          },
          '@screen xl': {
            maxWidth: theme('screens.xl'),
            paddingLeft: theme('spacing.12'),
            paddingRight: theme('spacing.12'),
          },
          '@screen 2xl': {
            maxWidth: theme('screens.2xl'),
          },
        },
        
        // Body scroll lock utility
        '.body-scroll-lock': {
          overflow: 'hidden',
        },
        
        // Touch target utility
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        
        // Focus ring utility
        '.focus-ring': {
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 2px ${theme('colors.brand-primary')}`,
            borderRadius: theme('borderRadius.md'),
          },
        },
        
        // Line clamp utilities
        '.line-clamp-2': {
          display: '-webkit-box',
          WebkitLineClamp: '2',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-3': {
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-4': {
          display: '-webkit-box',
          WebkitLineClamp: '4',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        },
        
        // Prose styling
        '.prose': {
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          maxWidth: 'none',
          '@screen sm': {
            fontSize: theme('fontSize.base[0]'),
            lineHeight: theme('fontSize.base[1].lineHeight'),
          },
          '@screen lg': {
            fontSize: theme('fontSize.lg[0]'),
            lineHeight: theme('fontSize.lg[1].lineHeight'),
          },
          '& h1': {
            fontSize: theme('fontSize.2xl[0]'),
            lineHeight: theme('fontSize.2xl[1].lineHeight'),
            fontWeight: theme('fontWeight.bold'),
            marginBottom: theme('spacing.4'),
            marginTop: theme('spacing.8'),
            '@screen sm': {
              fontSize: theme('fontSize.3xl[0]'),
              lineHeight: theme('fontSize.3xl[1].lineHeight'),
              marginBottom: theme('spacing.6'),
              marginTop: theme('spacing.10'),
            },
            '@screen lg': {
              fontSize: theme('fontSize.4xl[0]'),
              lineHeight: theme('fontSize.4xl[1].lineHeight'),
              marginBottom: theme('spacing.8'),
              marginTop: theme('spacing.12'),
            },
          },
          '& h2': {
            fontSize: theme('fontSize.xl[0]'),
            lineHeight: theme('fontSize.xl[1].lineHeight'),
            fontWeight: theme('fontWeight.bold'),
            marginBottom: theme('spacing.3'),
            marginTop: theme('spacing.6'),
            '@screen sm': {
              fontSize: theme('fontSize.2xl[0]'),
              lineHeight: theme('fontSize.2xl[1].lineHeight'),
              marginBottom: theme('spacing.4'),
              marginTop: theme('spacing.8'),
            },
            '@screen lg': {
              fontSize: theme('fontSize.3xl[0]'),
              lineHeight: theme('fontSize.3xl[1].lineHeight'),
              marginBottom: theme('spacing.6'),
              marginTop: theme('spacing.10'),
            },
          },
          '& p': {
            marginBottom: theme('spacing.3'),
            '@screen sm': {
              marginBottom: theme('spacing.4'),
            },
            '@screen lg': {
              marginBottom: theme('spacing.6'),
            },
          },
        },
        
        // ===== ANIMATION COMPONENTS =====
        '.floating-element': {
          animation: 'float 4s ease-in-out infinite',
          animationDelay: '1s',
        },
        '.fade-in': {
          opacity: '0',
          transform: 'translateY(20px)',
          animation: 'fadeIn 0.6s ease-out forwards',
        },
        '.scale-in': {
          opacity: '0',
          transform: 'scale(0.9)',
          animation: 'scaleIn 0.5s ease-out forwards',
        },
        '.slide-in-left': {
          opacity: '0',
          transform: 'translateX(-30px)',
          animation: 'slideInLeft 0.6s ease-out forwards',
        },
        '.slide-in-right': {
          opacity: '0',
          transform: 'translateX(30px)',
          animation: 'slideInRight 0.6s ease-out forwards',
        },
        '.glow-blue': {
          animation: 'glow 2s ease-in-out infinite alternate',
        },
        
        // Stagger animation items
        '.stagger-item': {
          opacity: '0',
          transform: 'translateY(20px)',
          animation: 'fadeIn 0.6s ease-out forwards',
          '&:nth-child(1)': { animationDelay: '0.1s' },
          '&:nth-child(2)': { animationDelay: '0.2s' },
          '&:nth-child(3)': { animationDelay: '0.3s' },
          '&:nth-child(4)': { animationDelay: '0.4s' },
          '&:nth-child(5)': { animationDelay: '0.5s' },
          '&:nth-child(6)': { animationDelay: '0.6s' },
        },
        
        // ===== CARD COMPONENTS =====
        '.card-professional': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.2xl'),
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.1)',
          },
          '.dark &': {
            backgroundColor: theme('colors.gray.800'),
            borderColor: 'rgba(59, 130, 246, 0.2)',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)',
            '&:hover': {
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.2)',
            },
          },
        },
        
        // ===== BUTTON COMPONENTS =====
        '.btn-animated': {
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          borderRadius: theme('borderRadius.xl'),
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            transition: 'left 0.5s',
          },
          '&:hover::before': {
            left: '100%',
          },
        },
        
        '.btn-expandable': {
          position: 'relative',
          width: '2.5rem',
          height: '2.5rem',
          padding: '0',
          overflow: 'visible',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          '&:hover': {
            padding: '0 0.75rem',
          },
          '& .btn-icon': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            position: 'absolute',
            left: '0',
            top: '0',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: '2',
          },
          '& .btn-text-expand': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0',
            whiteSpace: 'nowrap',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            width: '100%',
            height: '100%',
            position: 'absolute',
            left: '0',
            top: '0',
            zIndex: '1',
          },
          '&:hover .btn-icon': {
            opacity: '0',
            transform: 'translateX(-10px)',
          },
          '&:hover .btn-text-expand': {
            opacity: '1',
          },
        },
        
        '.btn-demo:hover': { width: '7.5rem' },
        '.btn-github:hover': { width: '9rem' },
        
        // ===== IMAGE COMPONENTS =====
        '.image-hover': {
          overflow: 'hidden',
          borderRadius: theme('borderRadius.xl'),
          transition: 'all 0.3s ease',
          '& img': {
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '&:hover img': {
            transform: 'scale(1.1)',
          },
        },
        
        // ===== ADMIN PANEL COMPONENTS =====
        '.admin-container': {
          display: 'flex',
          flexDirection: 'column',
          gap: theme('spacing.6'),
          width: '100%',
          maxWidth: 'none',
          '@screen sm': {
            gap: theme('spacing.8'),
          },
        },
        
        '.admin-header': {
          display: 'flex',
          flexDirection: 'column',
          gap: theme('spacing.4'),
          marginBottom: theme('spacing.6'),
          '@screen sm': {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme('spacing.8'),
          },
        },
        
        '.admin-title': {
          fontSize: theme('fontSize.2xl[0]'),
          lineHeight: theme('fontSize.2xl[1].lineHeight'),
          fontWeight: theme('fontWeight.bold'),
          color: theme('colors.gray.900'),
          '@screen sm': {
            fontSize: theme('fontSize.3xl[0]'),
            lineHeight: theme('fontSize.3xl[1].lineHeight'),
          },
          '@screen lg': {
            fontSize: theme('fontSize.4xl[0]'),
            lineHeight: theme('fontSize.4xl[1].lineHeight'),
          },
          '.dark &': {
            color: theme('colors.white'),
          },
        },
        
        '.admin-subtitle': {
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          color: theme('colors.gray.600'),
          marginTop: theme('spacing.1'),
          '@screen sm': {
            fontSize: theme('fontSize.base[0]'),
            lineHeight: theme('fontSize.base[1].lineHeight'),
            marginTop: theme('spacing.2'),
          },
          '.dark &': {
            color: theme('colors.gray.400'),
          },
        },
        
        '.admin-section': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.lg'),
          border: `1px solid ${theme('colors.gray.200')}`,
          overflow: 'hidden',
          '@screen sm': {
            borderRadius: theme('borderRadius.2xl'),
          },
          '.dark &': {
            backgroundColor: theme('colors.dark-card'),
            borderColor: theme('colors.dark-border'),
          },
        },
        
        '.admin-section-header': {
          padding: `${theme('spacing.4')} ${theme('spacing.4')}`,
          borderBottom: `1px solid ${theme('colors.gray.200')}`,
          background: `linear-gradient(to right, ${theme('colors.gray.50')}, ${theme('colors.gray.100')})`,
          '@screen sm': {
            padding: `${theme('spacing.5')} ${theme('spacing.6')}`,
          },
          '.dark &': {
            borderBottomColor: theme('colors.dark-border'),
            background: `linear-gradient(to right, ${theme('colors.gray.800')}, ${theme('colors.gray.700')})`,
          },
        },
        
        '.admin-section-title': {
          fontSize: theme('fontSize.lg[0]'),
          lineHeight: theme('fontSize.lg[1].lineHeight'),
          fontWeight: theme('fontWeight.semibold'),
          color: theme('colors.gray.900'),
          '@screen sm': {
            fontSize: theme('fontSize.xl[0]'),
            lineHeight: theme('fontSize.xl[1].lineHeight'),
          },
          '.dark &': {
            color: theme('colors.white'),
          },
        },
        
        '.admin-section-content': {
          padding: theme('spacing.4'),
          '@screen sm': {
            padding: theme('spacing.6'),
          },
        },
        
        '.admin-grid': {
          display: 'grid',
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          gap: theme('spacing.4'),
          '@screen sm': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: theme('spacing.6'),
          },
          '@screen lg': {
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          },
        },
        
        '.admin-form-grid': {
          display: 'grid',
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          gap: theme('spacing.4'),
          '@screen sm': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          },
        },
        
        '.admin-card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          padding: theme('spacing.4'),
          boxShadow: theme('boxShadow.lg'),
          border: `1px solid ${theme('colors.gray.200')}`,
          transition: 'all 0.3s ease-out',
          '@screen sm': {
            padding: theme('spacing.6'),
          },
          '&:hover': {
            boxShadow: theme('boxShadow.xl'),
          },
          '.dark &': {
            backgroundColor: theme('colors.dark-card'),
            borderColor: theme('colors.dark-border'),
          },
        },
        
        // Admin Button Components
        '.admin-btn': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme('spacing.2'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.3s ease-out',
          minHeight: '44px',
          touchAction: 'manipulation',
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 2px ${theme('colors.blue.500')}`,
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
          '@screen sm': {
            padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          },
        },
        
        '.admin-btn-primary': {
          backgroundColor: theme('colors.blue.600'),
          color: theme('colors.white'),
          boxShadow: theme('boxShadow.lg'),
          '&:hover': {
            backgroundColor: theme('colors.blue.700'),
            boxShadow: theme('boxShadow.xl'),
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
        
        '.admin-btn-secondary': {
          backgroundColor: theme('colors.gray.200'),
          color: theme('colors.gray.900'),
          border: `1px solid ${theme('colors.gray.300')}`,
          '&:hover': {
            backgroundColor: theme('colors.gray.300'),
          },
          '.dark &': {
            backgroundColor: theme('colors.gray.700'),
            color: theme('colors.gray.100'),
            borderColor: theme('colors.gray.600'),
            '&:hover': {
              backgroundColor: theme('colors.gray.600'),
            },
          },
        },
        
        '.admin-btn-danger': {
          backgroundColor: theme('colors.red.600'),
          color: theme('colors.white'),
          boxShadow: theme('boxShadow.lg'),
          '&:hover': {
            backgroundColor: theme('colors.red.700'),
            boxShadow: theme('boxShadow.xl'),
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
        
        '.admin-btn-success': {
          backgroundColor: theme('colors.green.600'),
          color: theme('colors.white'),
          boxShadow: theme('boxShadow.lg'),
          '&:hover': {
            backgroundColor: theme('colors.green.700'),
            boxShadow: theme('boxShadow.xl'),
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
        
        // Admin Form Components
        '.admin-input': {
          width: '100%',
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          border: `1px solid ${theme('colors.gray.300')}`,
          borderRadius: theme('borderRadius.lg'),
          backgroundColor: theme('colors.white'),
          color: theme('colors.gray.900'),
          minHeight: '44px',
          touchAction: 'manipulation',
          transition: 'all 0.2s ease-in-out',
          '&::placeholder': {
            color: theme('colors.gray.500'),
          },
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.blue.500'),
            boxShadow: `0 0 0 2px ${theme('colors.blue.500')}33`,
          },
          '@screen sm': {
            padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          },
          '.dark &': {
            backgroundColor: theme('colors.gray.800'),
            borderColor: theme('colors.gray.600'),
            color: theme('colors.gray.100'),
            '&::placeholder': {
              color: theme('colors.gray.400'),
            },
          },
        },
        
        '.admin-textarea': {
          resize: 'vertical',
          minHeight: '120px',
        },
        
        '.admin-select': {
          cursor: 'pointer',
        },
        
        // Admin Status Components
        '.admin-status-active': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: `${theme('spacing.1')} ${theme('spacing.2')}`,
          borderRadius: theme('borderRadius.full'),
          fontSize: theme('fontSize.xs[0]'),
          fontWeight: theme('fontWeight.medium'),
          backgroundColor: theme('colors.green.100'),
          color: theme('colors.green.800'),
          '.dark &': {
            backgroundColor: theme('colors.green.900'),
            color: theme('colors.green.200'),
          },
        },
        
        '.admin-status-inactive': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: `${theme('spacing.1')} ${theme('spacing.2')}`,
          borderRadius: theme('borderRadius.full'),
          fontSize: theme('fontSize.xs[0]'),
          fontWeight: theme('fontWeight.medium'),
          backgroundColor: theme('colors.red.100'),
          color: theme('colors.red.800'),
          '.dark &': {
            backgroundColor: theme('colors.red.900'),
            color: theme('colors.red.200'),
          },
        },
        
        '.admin-status-pending': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: `${theme('spacing.1')} ${theme('spacing.2')}`,
          borderRadius: theme('borderRadius.full'),
          fontSize: theme('fontSize.xs[0]'),
          fontWeight: theme('fontWeight.medium'),
          backgroundColor: theme('colors.yellow.100'),
          color: theme('colors.yellow.800'),
          '.dark &': {
            backgroundColor: theme('colors.yellow.900'),
            color: theme('colors.yellow.200'),
          },
        },
        
        // Responsive typography components
        '.text-responsive-display': {
          fontSize: theme('fontSize.3xl[0]'),
          lineHeight: theme('fontSize.3xl[1].lineHeight'),
          fontWeight: theme('fontWeight.bold'),
          '@screen sm': {
            fontSize: theme('fontSize.4xl[0]'),
            lineHeight: theme('fontSize.4xl[1].lineHeight'),
          },
          '@screen lg': {
            fontSize: theme('fontSize.5xl[0]'),
            lineHeight: theme('fontSize.5xl[1].lineHeight'),
          },
          '@screen xl': {
            fontSize: theme('fontSize.6xl[0]'),
            lineHeight: theme('fontSize.6xl[1].lineHeight'),
          },
        },
        
        '.text-responsive-heading': {
          fontSize: theme('fontSize.xl[0]'),
          lineHeight: theme('fontSize.xl[1].lineHeight'),
          fontWeight: theme('fontWeight.semibold'),
          '@screen sm': {
            fontSize: theme('fontSize.2xl[0]'),
            lineHeight: theme('fontSize.2xl[1].lineHeight'),
          },
          '@screen lg': {
            fontSize: theme('fontSize.3xl[0]'),
            lineHeight: theme('fontSize.3xl[1].lineHeight'),
          },
        },
        
        '.text-responsive-body': {
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          '@screen sm': {
            fontSize: theme('fontSize.base[0]'),
            lineHeight: theme('fontSize.base[1].lineHeight'),
          },
          '@screen lg': {
            fontSize: theme('fontSize.lg[0]'),
            lineHeight: theme('fontSize.lg[1].lineHeight'),
          },
        },
        
        // Responsive spacing components
        '.space-responsive': {
          '& > * + *': {
            marginTop: theme('spacing.4'),
            '@screen sm': {
              marginTop: theme('spacing.6'),
            },
            '@screen lg': {
              marginTop: theme('spacing.8'),
            },
          },
        },
        
        // Responsive grid components
        '.grid-responsive-cards': {
          display: 'grid',
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          gap: theme('spacing.4'),
          '@screen sm': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: theme('spacing.6'),
          },
          '@screen lg': {
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: theme('spacing.8'),
          },
          '@screen xl': {
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          },
        },
        
        // Touch-optimized button component
        '.btn-touch': {
          minHeight: theme('spacing.11'), // 44px minimum touch target
          minWidth: theme('spacing.11'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontSize: theme('fontSize.base[0]'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          touchAction: 'manipulation',
          userSelect: 'none',
          '@screen sm': {
            minHeight: theme('spacing.12'), // 48px for larger screens
            padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        
        // Responsive card component
        '.card-responsive': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.mobile-sm'),
          padding: theme('spacing.4'),
          '@screen sm': {
            padding: theme('spacing.6'),
            boxShadow: theme('boxShadow.card-light'),
          },
          '@screen lg': {
            padding: theme('spacing.8'),
          },
          '.dark &': {
            backgroundColor: theme('colors.dark-card'),
            boxShadow: theme('boxShadow.mobile-dark-sm'),
            '@screen sm': {
              boxShadow: theme('boxShadow.card-dark'),
            },
          },
        },
        
        // Mobile-optimized form elements
        '.form-input-responsive': {
          width: '100%',
          minHeight: theme('spacing.12'), // 48px for touch
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.base[0]'),
          borderWidth: '1px',
          borderColor: theme('colors.gray.300'),
          borderRadius: theme('borderRadius.lg'),
          backgroundColor: theme('colors.white'),
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.brand-primary'),
            boxShadow: `0 0 0 3px ${theme('colors.brand-primary')}33`,
          },
          '.dark &': {
            backgroundColor: theme('colors.gray.700'),
            borderColor: theme('colors.gray.600'),
            color: theme('colors.gray.100'),
          },
          '@screen sm': {
            minHeight: theme('spacing.11'), // 44px for desktop
            padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          },
        },
        
        // Responsive image container
        '.image-container-responsive': {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: theme('borderRadius.lg'),
          '& img': {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease-in-out',
          },
          '@media (hover: hover)': {
            '&:hover img': {
              transform: 'scale(1.05)',
            },
          },
        },
      });
      
      // Add responsive utility classes
      addUtilities({
        // Responsive visibility utilities
        '.show-mobile': {
          display: 'block',
          '@screen sm': {
            display: 'none',
          },
        },
        '.hide-mobile': {
          display: 'none',
          '@screen sm': {
            display: 'block',
          },
        },
        '.show-tablet': {
          display: 'none',
          '@screen sm': {
            display: 'block',
          },
          '@screen lg': {
            display: 'none',
          },
        },
        '.show-desktop': {
          display: 'none',
          '@screen lg': {
            display: 'block',
          },
        },
        
        // Touch-optimized utilities
        '.touch-manipulation': {
          touchAction: 'manipulation',
        },
        '.touch-pan-x': {
          touchAction: 'pan-x',
        },
        '.touch-pan-y': {
          touchAction: 'pan-y',
        },
        '.touch-none': {
          touchAction: 'none',
        },
        
        // Mobile-optimized scrolling
        '.scroll-smooth-mobile': {
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        },
        
        // Performance optimizations for mobile
        '.mobile-optimized': {
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        
        // Safe area utilities for mobile devices
        '.pt-safe': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.pb-safe': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.pl-safe': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.pr-safe': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        
        // Dynamic viewport height utilities
        '.h-dvh': {
          height: '100dvh',
        },
        '.min-h-dvh': {
          minHeight: '100dvh',
        },
        '.max-h-dvh': {
          maxHeight: '100dvh',
        },
        
        // Responsive text truncation utilities
        '.truncate-responsive-1': {
          display: '-webkit-box',
          WebkitLineClamp: '1',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          '@screen sm': {
            WebkitLineClamp: '2',
          },
        },
        '.truncate-responsive-2': {
          display: '-webkit-box',
          WebkitLineClamp: '2',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          '@screen sm': {
            WebkitLineClamp: '3',
          },
        },
        '.truncate-responsive-3': {
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          '@screen sm': {
            WebkitLineClamp: '4',
          },
        },
      });
    },
    
    // Enhanced responsive typography plugin
    function({ addUtilities, theme }: { addUtilities: any, theme: any }) {
      const responsiveTypography = {
        // Responsive heading utilities
        '.text-heading-responsive-sm': {
          fontSize: theme('fontSize.lg[0]'),
          lineHeight: theme('fontSize.lg[1].lineHeight'),
          fontWeight: theme('fontWeight.semibold'),
          '@screen sm': {
            fontSize: theme('fontSize.xl[0]'),
            lineHeight: theme('fontSize.xl[1].lineHeight'),
          },
          '@screen lg': {
            fontSize: theme('fontSize.2xl[0]'),
            lineHeight: theme('fontSize.2xl[1].lineHeight'),
          },
        },
        
        '.text-heading-responsive-md': {
          fontSize: theme('fontSize.xl[0]'),
          lineHeight: theme('fontSize.xl[1].lineHeight'),
          fontWeight: theme('fontWeight.semibold'),
          '@screen sm': {
            fontSize: theme('fontSize.2xl[0]'),
            lineHeight: theme('fontSize.2xl[1].lineHeight'),
          },
          '@screen lg': {
            fontSize: theme('fontSize.3xl[0]'),
            lineHeight: theme('fontSize.3xl[1].lineHeight'),
          },
        },
        
        '.text-heading-responsive-lg': {
          fontSize: theme('fontSize.2xl[0]'),
          lineHeight: theme('fontSize.2xl[1].lineHeight'),
          fontWeight: theme('fontWeight.bold'),
          '@screen sm': {
            fontSize: theme('fontSize.3xl[0]'),
            lineHeight: theme('fontSize.3xl[1].lineHeight'),
          },
          '@screen lg': {
            fontSize: theme('fontSize.4xl[0]'),
            lineHeight: theme('fontSize.4xl[1].lineHeight'),
          },
        },
        
        '.text-heading-responsive-xl': {
          fontSize: theme('fontSize.3xl[0]'),
          lineHeight: theme('fontSize.3xl[1].lineHeight'),
          fontWeight: theme('fontWeight.bold'),
          '@screen sm': {
            fontSize: theme('fontSize.4xl[0]'),
            lineHeight: theme('fontSize.4xl[1].lineHeight'),
          },
          '@screen lg': {
            fontSize: theme('fontSize.5xl[0]'),
            lineHeight: theme('fontSize.5xl[1].lineHeight'),
          },
        },
        
        // Responsive body text utilities
        '.text-body-responsive-sm': {
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          '@screen sm': {
            fontSize: theme('fontSize.base[0]'),
            lineHeight: theme('fontSize.base[1].lineHeight'),
          },
        },
        
        '.text-body-responsive-md': {
          fontSize: theme('fontSize.base[0]'),
          lineHeight: theme('fontSize.base[1].lineHeight'),
          '@screen sm': {
            fontSize: theme('fontSize.lg[0]'),
            lineHeight: theme('fontSize.lg[1].lineHeight'),
          },
        },
        
        '.text-body-responsive-lg': {
          fontSize: theme('fontSize.lg[0]'),
          lineHeight: theme('fontSize.lg[1].lineHeight'),
          '@screen sm': {
            fontSize: theme('fontSize.xl[0]'),
            lineHeight: theme('fontSize.xl[1].lineHeight'),
          },
        },
        
        // Responsive caption utilities
        '.text-caption-responsive': {
          fontSize: theme('fontSize.xs[0]'),
          lineHeight: theme('fontSize.xs[1].lineHeight'),
          color: theme('colors.gray.600'),
          '@screen sm': {
            fontSize: theme('fontSize.sm[0]'),
            lineHeight: theme('fontSize.sm[1].lineHeight'),
          },
          '.dark &': {
            color: theme('colors.gray.400'),
          },
        },
      };
      
      addUtilities(responsiveTypography);
    },
    
    // Enhanced aspect ratio plugin for responsive images
    function({ addUtilities, theme }: { addUtilities: any, theme: any }) {
      const responsiveAspectRatios = {
        // Dynamic aspect ratios based on screen size
        '.aspect-responsive-square': {
          aspectRatio: '1 / 1',
        },
        
        '.aspect-responsive-video': {
          aspectRatio: '4 / 3',
          '@screen sm': {
            aspectRatio: '16 / 9',
          },
        },
        
        '.aspect-responsive-photo': {
          aspectRatio: '1 / 1',
          '@screen sm': {
            aspectRatio: '4 / 3',
          },
        },
        
        '.aspect-responsive-banner': {
          aspectRatio: '2 / 1',
          '@screen sm': {
            aspectRatio: '3 / 1',
          },
          '@screen lg': {
            aspectRatio: '4 / 1',
          },
        },
        
        '.aspect-responsive-portrait': {
          aspectRatio: '3 / 4',
          '@screen sm': {
            aspectRatio: '2 / 3',
          },
        },
        
        '.aspect-responsive-landscape': {
          aspectRatio: '4 / 3',
          '@screen sm': {
            aspectRatio: '3 / 2',
          },
          '@screen lg': {
            aspectRatio: '16 / 9',
          },
        },
        
        // Project-specific aspect ratios
        '.aspect-project-card': {
          aspectRatio: '1 / 1',
          '@screen sm': {
            aspectRatio: '4 / 3',
          },
          '@screen lg': {
            aspectRatio: '16 / 10',
          },
        },
        
        '.aspect-blog-card': {
          aspectRatio: '4 / 3',
          '@screen sm': {
            aspectRatio: '16 / 9',
          },
        },
        
        '.aspect-gallery-thumb': {
          aspectRatio: '1 / 1',
        },
        
        '.aspect-hero-image': {
          aspectRatio: '4 / 3',
          '@screen sm': {
            aspectRatio: '3 / 2',
          },
          '@screen lg': {
            aspectRatio: '5 / 2',
          },
        },
        
        // Avatar and profile image aspect ratios
        '.aspect-avatar': {
          aspectRatio: '1 / 1',
          borderRadius: theme('borderRadius.full'),
          objectFit: 'cover',
        },
        
        '.aspect-cover': {
          aspectRatio: '2 / 1',
          '@screen sm': {
            aspectRatio: '3 / 1',
          },
          '@screen lg': {
            aspectRatio: '4 / 1',
          },
        },
      };
      
      addUtilities(responsiveAspectRatios);
    },
  ],
};

export default config;