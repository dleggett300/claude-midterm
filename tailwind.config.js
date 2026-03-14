/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf4e7',
          100: '#fbe3c3',
          200: '#f6c78a',
          300: '#efa750',
          400: '#e88928',
          500: '#df7116',
          600: '#bf5e0e',
          700: '#333333',
          800: '#1c1c1c',
          900: '#000000',
        },
      },
    },
  },
  plugins: [],
}
