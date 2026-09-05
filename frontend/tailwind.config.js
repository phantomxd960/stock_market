/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0a0e17',
          card: '#111827',
          cardLight: '#1f2937',
          border: '#1e293b',
          accent: '#0ea5e9',
          green: '#10b981',
          red: '#ef4444',
          gold: '#f59e0b'
        }
      }
    },
  },
  plugins: [],
}
