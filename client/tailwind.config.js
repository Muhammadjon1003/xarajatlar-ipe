/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#121212',
          surface: '#1c1c1f',
          card: '#242428',
          border: '#333338',
        },
        accent: {
          orange: '#f97316',
          orangeDark: '#ea580c',
          yellow: '#facc15',
          gold: '#eab308',
          amber: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
