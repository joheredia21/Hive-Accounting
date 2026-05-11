/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hive: {
          red: '#E31337',
          dark: '#212529',
          light: '#F8F9FA',
          gray: '#6C757D'
        }
      }
    },
  },
  plugins: [],
}
