/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FBF7EF',
          dark: '#161311',
        },
        ink: {
          DEFAULT: '#241F1C',
          light: '#EDE6DA',
        },
        seal: {
          50: '#FBEAE5',
          100: '#F3C9BC',
          300: '#DE7C5C',
          500: '#C1442E',
          600: '#A73824',
          700: '#872A1B',
        },
        gold: {
          300: '#E8C879',
          500: '#C9A227',
          600: '#A8841B',
        },
        jade: {
          400: '#6FA089',
          500: '#4C7C68',
          600: '#3A6152',
        },
      },
      fontFamily: {
        display: ['"Noto Serif TC"', '"Noto Serif Thai"', 'serif'],
        body: ['"Inter"', '"Noto Sans Thai"', '"Noto Sans SC"', 'sans-serif'],
        zh: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        stamp: '0 2px 0 0 rgba(36,31,28,0.08)',
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(36,31,28,0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
}
