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
      colors: {
        "brand-primary": "#0078D4",
        "light-bg": "#FFFFFF",
        "light-text": "#111827",
        "dark-bg": "#0A0A0A",
        "dark-text": "#EDEDED",
        "dark-card": "#121212",
        "dark-border": "#262626",
      },
      
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4)' },
        },
      },
      
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
    function({ addComponents, theme }: { addComponents: any, theme: any }) {
      addComponents({
        // ===== LAYOUT COMPONENTS =====
        '.container-responsive': {
          width: '100%',
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen lg': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
        },
        
        '.body-scroll-lock': {
          overflow: 'hidden',
        },
        
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        
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
        
        '.card-responsive': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.sm'),
          padding: theme('spacing.4'),
          transition: 'all 0.3s ease',
          '@screen sm': {
            padding: theme('spacing.6'),
            boxShadow: theme('boxShadow.md'),
          },
          '@screen lg': {
            padding: theme('spacing.8'),
            boxShadow: theme('boxShadow.lg'),
          },
          '.dark &': {
            backgroundColor: theme('colors.dark-card'),
            borderColor: theme('colors.dark-border'),
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
        
        '.btn-touch': {
          minHeight: '44px',
          minWidth: '44px',
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
            minHeight: '48px',
            padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        
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
        
        '.form-input-responsive': {
          width: '100%',
          minHeight: '48px',
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
            minHeight: '44px',
            padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          },
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
        
        // ===== RESPONSIVE TYPOGRAPHY COMPONENTS =====
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
        
        '.text-body-responsive-md': {
          fontSize: theme('fontSize.base[0]'),
          lineHeight: theme('fontSize.base[1].lineHeight'),
          '@screen sm': {
            fontSize: theme('fontSize.lg[0]'),
            lineHeight: theme('fontSize.lg[1].lineHeight'),
          },
        },
        
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
        
        // ===== RESPONSIVE GRID COMPONENTS =====
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
        
        // ===== SPACING COMPONENTS =====
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
      });
    },
  ],
};

export default config;