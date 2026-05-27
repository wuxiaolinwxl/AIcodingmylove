/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { 50: '#FBF8F4', 100: '#F5F0E8', 200: '#EAE2D5', 300: '#D4C7B5' },
        ink: { 900: '#2A2622', 700: '#5A524A', 500: '#8B7F73', 300: '#B8AC9F' },
        rose: {
          50: '#FDF4F4', 100: '#FBE8E8', 200: '#F5C9CC', 300: '#EDA4AA',
          400: '#E47C86', 500: '#D85667', 600: '#B83E50', 700: '#8F2C3D',
        },
      },
      fontFamily: {
        hand: ['Caveat', 'cursive'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(42,38,34,.04), 0 2px 8px rgba(42,38,34,.04)',
        card: '0 1px 3px rgba(42,38,34,.05), 0 4px 16px rgba(42,38,34,.04)',
        pop: '0 6px 24px rgba(216,86,103,.18)',
      },
      borderRadius: {
        xl: '.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22,0.61,0.36,1)',
      },
    },
  },
  plugins: [],
}
