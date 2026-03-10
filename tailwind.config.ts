import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50:  '#EBF5FF',
          100: '#D0E8FA',
          200: '#A3D0F2',
          300: '#5AAEE0',
          400: '#2A8EC9',
          500: '#105F92',  // primary — Karwia brand blue
          600: '#0A4A73',
          700: '#073655',
          800: '#042338',
          900: '#02111C',
        },
        sand: {
          50:  '#FFFDF5',
          100: '#FFF8E1',
          200: '#FFEDB3',
          300: '#FFD966',
          400: '#F5C400',
          500: '#F49A1A',  // accent — Karwia brand orange/gold
          600: '#C27D00',
          700: '#8F5800',
          800: '#5C3700',
          900: '#2E1B00',
        },
        sea: {
          light: '#E8F4FD',
          mid:   '#B3D9F4',
          dark:  '#105F92',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        heading: ['Kanit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 4px 24px rgba(15,95,146,0.10)',
        'card-hover': '0 8px 32px rgba(15,95,146,0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
