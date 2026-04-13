/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#f59e0b',
        brand: '#FFBD00',
        'brand-dark': '#E6A800',
        'brand-accent': '#FFD04D',
        'dark-bg': '#0A0A0A',
        'dark-surface': '#141414',
        'dark-surface-2': '#1E1E1E',
        'dark-text': '#F5F5F5',
        'dark-muted': '#A3A3A3',
      },
    },
  },
  plugins: [],
};
