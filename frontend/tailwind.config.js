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
          50: '#FAF5F0',
          100: '#F5EAE0',
          200: '#E6D5C1',
          300: '#D7BFA3',
          400: '#C8AA84',
          500: '#B99465',
          600: '#9A7F56',
          700: '#7B6544',
          800: '#5C4C33',
          900: '#3D3222',
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
    padding: true,
  },
}