/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        card: '#0f0f14',
        cardForeground: '#fafafa',
        popover: '#0f0f14',
        popoverForeground: '#fafafa',
        primary: '#3b82f6',
        primaryForeground: '#ffffff',
        secondary: '#1e1e24',
        secondaryForeground: '#fafafa',
        muted: '#1e1e24',
        mutedForeground: '#a1a1aa',
        accent: '#222228',
        accentForeground: '#fafafa',
        destructive: '#dc2626',
        destructiveForeground: '#fafafa',
        border: '#222228',
        input: '#222228',
        ring: '#3b82f6',
        success: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
      },
      fontFamily: {
        sans: ['System'],
        mono: ['monospace'],
      },
    },
  },
  plugins: [],
};
