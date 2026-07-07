/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          light: '#9E2A2B',
          DEFAULT: '#7A1B22', 
          dark: '#540B0E',
        },
        gold: {
          light: '#F4D03F',
          DEFAULT: '#D4AF37', 
        },
        background: '#F3F4F6', 
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], 
      }
    },
  },
  plugins: [],
}