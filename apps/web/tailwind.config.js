/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f0ff',
          100: '#e0e0ff',
          200: '#c7c6ff',
          300: '#a8a4ff',
          400: '#8b7cf6',
          500: '#7c63f0',
          600: '#6c4de4',
          700: '#5c3bc9',
          800: '#4c31a8',
          900: '#1a1a2e',
        },
      },
      fontFamily: {
        sans:    ['var(--font-geist-sans)', 'Inter', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
        mono:    ['monospace'],
      },
      animation: {
        'fade-up':     'fadeUp 0.4s ease forwards',
        'fade-in':     'fadeIn 0.3s ease forwards',
        'slide-right': 'slideRight 0.3s ease forwards',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:     { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        slideRight: { from: { transform: 'translateX(-8px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        pulseSoft:  { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
};