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
        mesh: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          primary: '#2563eb',
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#10b981'
        }
      }
    },
  },
  plugins: [],
}
