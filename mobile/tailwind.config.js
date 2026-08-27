/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'oklch(0.55 0.18 255)',
          foreground: 'oklch(0.99 0 0)',
          50: 'oklch(0.97 0.02 255)',
          100: 'oklch(0.93 0.04 255)',
          500: 'oklch(0.55 0.18 255)',
          600: 'oklch(0.48 0.20 255)',
          700: 'oklch(0.42 0.18 255)',
        },
        background: 'oklch(0.99 0 0)',
        foreground: 'oklch(0.15 0 0)',
        muted: 'oklch(0.96 0 0)',
        'muted-foreground': 'oklch(0.50 0 0)',
        border: 'oklch(0.90 0 0)',
        destructive: 'oklch(0.60 0.20 25)',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};