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
        /* shadcn/ui standard tokens — read from CSS variables (OKLCH) */
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "oklch(var(--success) / <alpha-value>)",
          foreground: "oklch(var(--success-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "oklch(var(--warning) / <alpha-value>)",
          foreground: "oklch(var(--warning-foreground) / <alpha-value>)",
        },
        info: {
          DEFAULT: "oklch(var(--info) / <alpha-value>)",
          foreground: "oklch(var(--info-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        /* Backward-compatible brand alias — still referenced in some places */
        "brand-primary": "oklch(var(--brand-primary) / <alpha-value>)",
      },

      borderRadius: {
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) * 1.5)",
      },

      backdropBlur: {
        xs: "4px",
      },

      boxShadow: {
        glow: "0 0 20px oklch(var(--primary) / 0.35)",
        "glow-lg":
          "0 0 20px oklch(var(--primary) / 0.5), 0 0 40px oklch(var(--primary) / 0.3)",
        "glass-sm": "0 4px 24px rgba(0, 0, 0, 0.06)",
        "glass-lg":
          "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
      },

      keyframes: {
        float: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
          "100%": { transform: "translateY(0px)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        glow: {
          "0%, 100%": {
            boxShadow: "0 0 5px oklch(var(--primary) / 0.3)",
          },
          "50%": {
            boxShadow:
              "0 0 20px oklch(var(--primary) / 0.6), 0 0 30px oklch(var(--primary) / 0.4)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "oklch(var(--primary) / 0.2)" },
          "50%": { borderColor: "oklch(var(--primary) / 0.6)" },
        },
        "blur-in": {
          from: {
            opacity: "0",
            filter: "blur(12px)",
            transform: "scale(0.95)",
          },
          to: { opacity: "1", filter: "blur(0)", transform: "scale(1)" },
        },
        "slide-up-fade": {
          from: {
            opacity: "0",
            transform: "translateY(30px) scale(0.98)",
          },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "morph-blob": {
          "0%": {
            borderRadius: "60% 40% 30% 70%/60% 30% 70% 40%",
          },
          "50%": {
            borderRadius: "30% 60% 70% 40%/50% 60% 30% 60%",
          },
          "100%": {
            borderRadius: "60% 40% 30% 70%/60% 30% 70% 40%",
          },
        },
      },

      animation: {
        float: "float 4s ease-in-out infinite",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.5s ease-out forwards",
        "slide-in-left": "slideInLeft 0.6s ease-out forwards",
        "slide-in-right": "slideInRight 0.6s ease-out forwards",
        glow: "glow 2s ease-in-out infinite alternate",
        shimmer: "shimmer 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 6s ease infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "border-glow": "border-glow 3s ease-in-out infinite",
        "blur-in": "blur-in 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-up-fade":
          "slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "morph-blob": "morph-blob 8s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
    function ({ addComponents, theme }: { addComponents: any; theme: any }) {
      addComponents({
        // ===== LAYOUT COMPONENTS =====
        ".container-responsive": {
          width: "100%",
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: theme("spacing.4"),
          paddingRight: theme("spacing.4"),
          "@screen sm": {
            paddingLeft: theme("spacing.6"),
            paddingRight: theme("spacing.6"),
          },
          "@screen lg": {
            paddingLeft: theme("spacing.8"),
            paddingRight: theme("spacing.8"),
          },
        },

        ".body-scroll-lock": {
          overflow: "hidden",
        },

        ".touch-target": {
          minWidth: "44px",
          minHeight: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },

        ".focus-ring": {
          "&:focus": {
            outline: "none",
            boxShadow: "0 0 0 2px oklch(var(--primary))",
            borderRadius: theme("borderRadius.md"),
          },
        },

        // Line clamp utilities
        ".line-clamp-2": {
          display: "-webkit-box",
          WebkitLineClamp: "2",
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        },
        ".line-clamp-3": {
          display: "-webkit-box",
          WebkitLineClamp: "3",
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        },
        ".line-clamp-4": {
          display: "-webkit-box",
          WebkitLineClamp: "4",
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        },

        // Prose styling
        ".prose": {
          fontSize: theme("fontSize.sm[0]"),
          lineHeight: theme("fontSize.sm[1].lineHeight"),
          maxWidth: "none",
          "@screen sm": {
            fontSize: theme("fontSize.base[0]"),
            lineHeight: theme("fontSize.base[1].lineHeight"),
          },
          "@screen lg": {
            fontSize: theme("fontSize.lg[0]"),
            lineHeight: theme("fontSize.lg[1].lineHeight"),
          },
          "& h1": {
            fontSize: theme("fontSize.2xl[0]"),
            lineHeight: theme("fontSize.2xl[1].lineHeight"),
            fontWeight: theme("fontWeight.bold"),
            marginBottom: theme("spacing.4"),
            marginTop: theme("spacing.8"),
            "@screen sm": {
              fontSize: theme("fontSize.3xl[0]"),
              lineHeight: theme("fontSize.3xl[1].lineHeight"),
              marginBottom: theme("spacing.6"),
              marginTop: theme("spacing.10"),
            },
            "@screen lg": {
              fontSize: theme("fontSize.4xl[0]"),
              lineHeight: theme("fontSize.4xl[1].lineHeight"),
              marginBottom: theme("spacing.8"),
              marginTop: theme("spacing.12"),
            },
          },
          "& h2": {
            fontSize: theme("fontSize.xl[0]"),
            lineHeight: theme("fontSize.xl[1].lineHeight"),
            fontWeight: theme("fontWeight.bold"),
            marginBottom: theme("spacing.3"),
            marginTop: theme("spacing.6"),
            "@screen sm": {
              fontSize: theme("fontSize.2xl[0]"),
              lineHeight: theme("fontSize.2xl[1].lineHeight"),
              marginBottom: theme("spacing.4"),
              marginTop: theme("spacing.8"),
            },
            "@screen lg": {
              fontSize: theme("fontSize.3xl[0]"),
              lineHeight: theme("fontSize.3xl[1].lineHeight"),
              marginBottom: theme("spacing.6"),
              marginTop: theme("spacing.10"),
            },
          },
          "& p": {
            marginBottom: theme("spacing.3"),
            "@screen sm": {
              marginBottom: theme("spacing.4"),
            },
            "@screen lg": {
              marginBottom: theme("spacing.6"),
            },
          },
        },

        // ===== ANIMATION COMPONENTS =====
        ".floating-element": {
          animation: "float 4s ease-in-out infinite",
          animationDelay: "1s",
        },
        ".fade-in": {
          opacity: "0",
          transform: "translateY(20px)",
          animation: "fadeIn 0.6s ease-out forwards",
        },
        ".scale-in": {
          opacity: "0",
          transform: "scale(0.9)",
          animation: "scaleIn 0.5s ease-out forwards",
        },
        ".slide-in-left": {
          opacity: "0",
          transform: "translateX(-30px)",
          animation: "slideInLeft 0.6s ease-out forwards",
        },
        ".slide-in-right": {
          opacity: "0",
          transform: "translateX(30px)",
          animation: "slideInRight 0.6s ease-out forwards",
        },
        ".glow-blue": {
          animation: "glow 2s ease-in-out infinite alternate",
        },

        // Stagger animation items
        ".stagger-item": {
          opacity: "0",
          transform: "translateY(20px)",
          animation: "fadeIn 0.6s ease-out forwards",
          "&:nth-child(1)": { animationDelay: "0.1s" },
          "&:nth-child(2)": { animationDelay: "0.2s" },
          "&:nth-child(3)": { animationDelay: "0.3s" },
          "&:nth-child(4)": { animationDelay: "0.4s" },
          "&:nth-child(5)": { animationDelay: "0.5s" },
          "&:nth-child(6)": { animationDelay: "0.6s" },
        },

        // ===== CARD COMPONENTS =====
        ".card-professional": {
          backgroundColor: "oklch(var(--card))",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          borderRadius: theme("borderRadius.2xl"),
          boxShadow: theme("boxShadow.glass-sm"),
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          border: "1px solid oklch(var(--border))",
          overflow: "hidden",
          "&:hover": {
            transform: "translateY(-4px)",
            backgroundColor: "oklch(var(--popover))",
            boxShadow:
              "0 20px 40px oklch(var(--primary) / 0.12), 0 0 0 1px oklch(var(--primary) / 0.15)",
            borderColor: "oklch(var(--primary) / 0.2)",
          },
        },

        ".card-responsive": {
          backgroundColor: "oklch(var(--card))",
          backdropFilter: "blur(12px) saturate(150%)",
          WebkitBackdropFilter: "blur(12px) saturate(150%)",
          borderRadius: theme("borderRadius.2xl"),
          border: "1px solid oklch(var(--border))",
          boxShadow: "0 2px 16px rgba(0, 0, 0, 0.04)",
          padding: theme("spacing.4"),
          transition: "all 0.4s ease",
          "@screen sm": {
            padding: theme("spacing.6"),
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
          },
          "@screen lg": {
            padding: theme("spacing.8"),
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
          },
        },

        // ===== BUTTON COMPONENTS =====
        ".btn-animated": {
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s ease",
          borderRadius: theme("borderRadius.xl"),
          boxShadow: "0 2px 8px oklch(var(--primary) / 0.2)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 25px oklch(var(--primary) / 0.3)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: "0",
            left: "-100%",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
            transition: "left 0.5s",
          },
          "&:hover::before": {
            left: "100%",
          },
        },

        ".btn-expandable": {
          position: "relative",
          width: "2.5rem",
          height: "2.5rem",
          padding: "0",
          overflow: "visible",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          "&:hover": {
            padding: "0 0.75rem",
          },
          "& .btn-icon": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.5rem",
            height: "2.5rem",
            position: "absolute",
            left: "0",
            top: "0",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: "2",
          },
          "& .btn-text-expand": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: "0",
            whiteSpace: "nowrap",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            width: "100%",
            height: "100%",
            position: "absolute",
            left: "0",
            top: "0",
            zIndex: "1",
          },
          "&:hover .btn-icon": {
            opacity: "0",
            transform: "translateX(-10px)",
          },
          "&:hover .btn-text-expand": {
            opacity: "1",
          },
        },

        ".btn-demo:hover": { width: "7.5rem" },
        ".btn-github:hover": { width: "9rem" },

        ".btn-touch": {
          minHeight: "44px",
          minWidth: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `${theme("spacing.2")} ${theme("spacing.4")}`,
          borderRadius: theme("borderRadius.lg"),
          fontSize: theme("fontSize.base[0]"),
          fontWeight: theme("fontWeight.medium"),
          transition: "all 0.2s ease-in-out",
          touchAction: "manipulation",
          userSelect: "none",
          "@screen sm": {
            minHeight: "48px",
            padding: `${theme("spacing.3")} ${theme("spacing.6")}`,
          },
          "&:active": {
            transform: "scale(0.98)",
          },
        },

        // ===== IMAGE COMPONENTS =====
        ".image-hover": {
          overflow: "hidden",
          borderRadius: theme("borderRadius.xl"),
          transition: "all 0.3s ease",
          "& img": {
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          },
          "&:hover img": {
            transform: "scale(1.1)",
          },
        },

        ".image-container-responsive": {
          position: "relative",
          overflow: "hidden",
          borderRadius: theme("borderRadius.lg"),
          "& img": {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease-in-out",
          },
          "@media (hover: hover)": {
            "&:hover img": {
              transform: "scale(1.05)",
            },
          },
        },

        // ===== ADMIN PANEL COMPONENTS =====
        ".admin-container": {
          display: "flex",
          flexDirection: "column",
          gap: theme("spacing.6"),
          width: "100%",
          maxWidth: "none",
          "@screen sm": {
            gap: theme("spacing.8"),
          },
        },

        ".admin-header": {
          display: "flex",
          flexDirection: "column",
          gap: theme("spacing.4"),
          marginBottom: theme("spacing.6"),
          "@screen sm": {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: theme("spacing.8"),
          },
        },

        ".admin-title": {
          fontSize: theme("fontSize.2xl[0]"),
          lineHeight: theme("fontSize.2xl[1].lineHeight"),
          fontWeight: theme("fontWeight.bold"),
          color: "oklch(var(--foreground))",
          "@screen sm": {
            fontSize: theme("fontSize.3xl[0]"),
            lineHeight: theme("fontSize.3xl[1].lineHeight"),
          },
          "@screen lg": {
            fontSize: theme("fontSize.4xl[0]"),
            lineHeight: theme("fontSize.4xl[1].lineHeight"),
          },
        },

        ".admin-subtitle": {
          fontSize: theme("fontSize.sm[0]"),
          lineHeight: theme("fontSize.sm[1].lineHeight"),
          color: "oklch(var(--muted-foreground))",
          marginTop: theme("spacing.1"),
          "@screen sm": {
            fontSize: theme("fontSize.base[0]"),
            lineHeight: theme("fontSize.base[1].lineHeight"),
            marginTop: theme("spacing.2"),
          },
        },

        ".admin-section": {
          backgroundColor: "oklch(var(--card))",
          borderRadius: theme("borderRadius.xl"),
          boxShadow: theme("boxShadow.lg"),
          border: "1px solid oklch(var(--border))",
          overflow: "hidden",
          "@screen sm": {
            borderRadius: theme("borderRadius.2xl"),
          },
        },

        ".admin-section-header": {
          padding: `${theme("spacing.4")} ${theme("spacing.4")}`,
          borderBottom: "1px solid oklch(var(--border))",
          background:
            "linear-gradient(to right, oklch(var(--muted)), oklch(var(--accent)))",
          "@screen sm": {
            padding: `${theme("spacing.5")} ${theme("spacing.6")}`,
          },
        },

        ".admin-section-title": {
          fontSize: theme("fontSize.lg[0]"),
          lineHeight: theme("fontSize.lg[1].lineHeight"),
          fontWeight: theme("fontWeight.semibold"),
          color: "oklch(var(--foreground))",
          "@screen sm": {
            fontSize: theme("fontSize.xl[0]"),
            lineHeight: theme("fontSize.xl[1].lineHeight"),
          },
        },

        ".admin-section-content": {
          padding: theme("spacing.4"),
          "@screen sm": {
            padding: theme("spacing.6"),
          },
        },

        ".admin-grid": {
          display: "grid",
          gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
          gap: theme("spacing.4"),
          "@screen sm": {
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: theme("spacing.6"),
          },
          "@screen lg": {
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          },
        },

        ".admin-form-grid": {
          display: "grid",
          gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
          gap: theme("spacing.4"),
          "@screen sm": {
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          },
        },

        ".admin-card": {
          backgroundColor: "oklch(var(--card))",
          borderRadius: theme("borderRadius.xl"),
          padding: theme("spacing.4"),
          boxShadow: theme("boxShadow.lg"),
          border: "1px solid oklch(var(--border))",
          transition: "all 0.3s ease-out",
          "@screen sm": {
            padding: theme("spacing.6"),
          },
          "&:hover": {
            boxShadow: theme("boxShadow.xl"),
          },
        },

        // Admin Button Components
        ".admin-btn": {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: theme("spacing.2"),
          padding: `${theme("spacing.2")} ${theme("spacing.4")}`,
          borderRadius: theme("borderRadius.lg"),
          fontWeight: theme("fontWeight.medium"),
          transition: "all 0.3s ease-out",
          minHeight: "44px",
          touchAction: "manipulation",
          "&:focus": {
            outline: "none",
            boxShadow: "0 0 0 2px oklch(var(--primary))",
          },
          "&:disabled": {
            opacity: "0.5",
            cursor: "not-allowed",
          },
          "@screen sm": {
            padding: `${theme("spacing.3")} ${theme("spacing.6")}`,
          },
        },

        ".admin-btn-primary": {
          backgroundColor: "oklch(var(--primary))",
          color: "oklch(var(--primary-foreground))",
          boxShadow: theme("boxShadow.lg"),
          "&:hover": {
            boxShadow: theme("boxShadow.xl"),
            transform: "scale(1.05)",
          },
          "&:active": {
            transform: "scale(0.95)",
          },
        },

        ".admin-btn-secondary": {
          backgroundColor: "oklch(var(--secondary))",
          color: "oklch(var(--secondary-foreground))",
          border: "1px solid oklch(var(--border))",
          "&:hover": {
            backgroundColor: "oklch(var(--accent))",
          },
        },

        ".admin-btn-danger": {
          backgroundColor: "oklch(var(--destructive))",
          color: "oklch(var(--destructive-foreground))",
          boxShadow: theme("boxShadow.lg"),
          "&:hover": {
            boxShadow: theme("boxShadow.xl"),
            transform: "scale(1.05)",
          },
          "&:active": {
            transform: "scale(0.95)",
          },
        },

        ".admin-btn-success": {
          backgroundColor: "oklch(var(--success))",
          color: "oklch(var(--success-foreground))",
          boxShadow: theme("boxShadow.lg"),
          "&:hover": {
            boxShadow: theme("boxShadow.xl"),
            transform: "scale(1.05)",
          },
          "&:active": {
            transform: "scale(0.95)",
          },
        },

        // Admin Form Components
        ".admin-input": {
          width: "100%",
          padding: `${theme("spacing.2")} ${theme("spacing.3")}`,
          border: "1px solid oklch(var(--input))",
          borderRadius: theme("borderRadius.lg"),
          backgroundColor: "oklch(var(--background))",
          color: "oklch(var(--foreground))",
          minHeight: "44px",
          touchAction: "manipulation",
          transition: "all 0.2s ease-in-out",
          "&::placeholder": {
            color: "oklch(var(--muted-foreground))",
          },
          "&:focus": {
            outline: "none",
            borderColor: "oklch(var(--primary))",
            boxShadow: "0 0 0 2px oklch(var(--ring))",
          },
          "@screen sm": {
            padding: `${theme("spacing.3")} ${theme("spacing.4")}`,
          },
        },

        ".admin-textarea": {
          resize: "vertical",
          minHeight: "120px",
        },

        ".admin-select": {
          cursor: "pointer",
        },

        ".form-input-responsive": {
          width: "100%",
          minHeight: "48px",
          padding: `${theme("spacing.3")} ${theme("spacing.4")}`,
          fontSize: theme("fontSize.base[0]"),
          borderWidth: "1px",
          borderColor: "oklch(var(--input))",
          borderRadius: theme("borderRadius.lg"),
          backgroundColor: "oklch(var(--background))",
          color: "oklch(var(--foreground))",
          transition: "all 0.2s ease-in-out",
          "&:focus": {
            outline: "none",
            borderColor: "oklch(var(--primary))",
            boxShadow: "0 0 0 3px oklch(var(--ring))",
          },
          "@screen sm": {
            minHeight: "44px",
            padding: `${theme("spacing.2")} ${theme("spacing.3")}`,
          },
        },

        // Admin Status Components
        ".admin-status-active": {
          display: "inline-flex",
          alignItems: "center",
          padding: `${theme("spacing.1")} ${theme("spacing.2")}`,
          borderRadius: theme("borderRadius.full"),
          fontSize: theme("fontSize.xs[0]"),
          fontWeight: theme("fontWeight.medium"),
          backgroundColor: "oklch(var(--success) / 0.15)",
          color: "oklch(var(--success))",
        },

        ".admin-status-inactive": {
          display: "inline-flex",
          alignItems: "center",
          padding: `${theme("spacing.1")} ${theme("spacing.2")}`,
          borderRadius: theme("borderRadius.full"),
          fontSize: theme("fontSize.xs[0]"),
          fontWeight: theme("fontWeight.medium"),
          backgroundColor: "oklch(var(--destructive) / 0.15)",
          color: "oklch(var(--destructive))",
        },

        ".admin-status-pending": {
          display: "inline-flex",
          alignItems: "center",
          padding: `${theme("spacing.1")} ${theme("spacing.2")}`,
          borderRadius: theme("borderRadius.full"),
          fontSize: theme("fontSize.xs[0]"),
          fontWeight: theme("fontWeight.medium"),
          backgroundColor: "oklch(var(--warning) / 0.15)",
          color: "oklch(var(--warning))",
        },

        // ===== RESPONSIVE TYPOGRAPHY COMPONENTS =====
        ".text-responsive-display": {
          fontSize: theme("fontSize.3xl[0]"),
          lineHeight: theme("fontSize.3xl[1].lineHeight"),
          fontWeight: theme("fontWeight.bold"),
          "@screen sm": {
            fontSize: theme("fontSize.4xl[0]"),
            lineHeight: theme("fontSize.4xl[1].lineHeight"),
          },
          "@screen lg": {
            fontSize: theme("fontSize.5xl[0]"),
            lineHeight: theme("fontSize.5xl[1].lineHeight"),
          },
          "@screen xl": {
            fontSize: theme("fontSize.6xl[0]"),
            lineHeight: theme("fontSize.6xl[1].lineHeight"),
          },
        },

        ".text-responsive-heading": {
          fontSize: theme("fontSize.xl[0]"),
          lineHeight: theme("fontSize.xl[1].lineHeight"),
          fontWeight: theme("fontWeight.semibold"),
          "@screen sm": {
            fontSize: theme("fontSize.2xl[0]"),
            lineHeight: theme("fontSize.2xl[1].lineHeight"),
          },
          "@screen lg": {
            fontSize: theme("fontSize.3xl[0]"),
            lineHeight: theme("fontSize.3xl[1].lineHeight"),
          },
        },

        ".text-responsive-body": {
          fontSize: theme("fontSize.sm[0]"),
          lineHeight: theme("fontSize.sm[1].lineHeight"),
          "@screen sm": {
            fontSize: theme("fontSize.base[0]"),
            lineHeight: theme("fontSize.base[1].lineHeight"),
          },
          "@screen lg": {
            fontSize: theme("fontSize.lg[0]"),
            lineHeight: theme("fontSize.lg[1].lineHeight"),
          },
        },

        ".text-heading-responsive-lg": {
          fontSize: theme("fontSize.2xl[0]"),
          lineHeight: theme("fontSize.2xl[1].lineHeight"),
          fontWeight: theme("fontWeight.bold"),
          "@screen sm": {
            fontSize: theme("fontSize.3xl[0]"),
            lineHeight: theme("fontSize.3xl[1].lineHeight"),
          },
          "@screen lg": {
            fontSize: theme("fontSize.4xl[0]"),
            lineHeight: theme("fontSize.4xl[1].lineHeight"),
          },
        },

        ".text-body-responsive-md": {
          fontSize: theme("fontSize.base[0]"),
          lineHeight: theme("fontSize.base[1].lineHeight"),
          "@screen sm": {
            fontSize: theme("fontSize.lg[0]"),
            lineHeight: theme("fontSize.lg[1].lineHeight"),
          },
        },

        ".text-caption-responsive": {
          fontSize: theme("fontSize.xs[0]"),
          lineHeight: theme("fontSize.xs[1].lineHeight"),
          color: "oklch(var(--muted-foreground))",
          "@screen sm": {
            fontSize: theme("fontSize.sm[0]"),
            lineHeight: theme("fontSize.sm[1].lineHeight"),
          },
        },

        // ===== RESPONSIVE GRID COMPONENTS =====
        ".grid-responsive-cards": {
          display: "grid",
          gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
          gap: theme("spacing.4"),
          "@screen sm": {
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: theme("spacing.6"),
          },
          "@screen lg": {
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: theme("spacing.8"),
          },
          "@screen xl": {
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          },
        },

        // ===== SPACING COMPONENTS =====
        ".space-responsive": {
          "& > * + *": {
            marginTop: theme("spacing.4"),
            "@screen sm": {
              marginTop: theme("spacing.6"),
            },
            "@screen lg": {
              marginTop: theme("spacing.8"),
            },
          },
        },
      });
    },
  ],
};

export default config;