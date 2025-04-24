/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your existing brown scale
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

        // Semantic mappings:
        primary: '#B68150', // brown.600
        'primary-dark': '#996C42', // brown.700

        secondary: '#DAC0A8', // brown.300
        'secondary-dark': '#CEAB8B',// brown.400

        danger: '#DC2626', // red.600 (error)
        'danger-dark': '#B91C1C', // red.700
      },
    },
  },
  plugins: [],
}
