/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: '#221a30',
        surface: '#2f2440',
        accent: '#8b6fe0',
        muted: '#b8aed1',
        success: '#4ade80',
        danger: '#f87171',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
