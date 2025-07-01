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
        // Vercel'den ilham alan yeni renkler
        "light-bg": "#FFFFFF", // Aydınlık mod arka planı (saf beyaz)
        "light-text": "#111827", // Aydınlık mod metin (koyu gri)
        "dark-bg": "#0A0A0A",   // Karanlık mod arka planı (siyaha yakın)
        "dark-text": "#EDEDED", // Karanlık mod metin (açık gri)
        "dark-card": "#121212", // Karanlık mod kart arka planı
        "dark-border": "#262626", // Karanlık mod kenarlık
      },
      boxShadow: {
        "card-light": "0 4px 14px 0 rgba(0, 0, 0, 0.05)",
        "card-dark": "0 4px 14px 0 rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate"), require("@tailwindcss/aspect-ratio")],
};
export default config;