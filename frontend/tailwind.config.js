/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#FAF6F2',
          100: '#F3EAE2',
          200: '#E7D5C5',
          300: '#DAC0A8',
          400: '#CEAB8B',
          500: '#C2966E',
          600: '#B68150',
          700: '#996C42',
          800: '#7C5735',
          900: '#5F4327',
        },
      },
    },
  },
  plugins: [],
}