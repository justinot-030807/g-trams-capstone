/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#FDF2F4',
          100: '#FCE7EA',
          200: '#F8C5CA',
          light: '#B83D40',
          DEFAULT: '#9E2A2B', 
          hover: '#7A1B22',
          dark: '#7A1B22',
        },
        gold: {
          light: '#F4D03F',
          DEFAULT: '#D4AF37', 
        },
        background: '#F3F4F6', 
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], 
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}