/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./app.vue",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px) rotate(4deg)' },
        },
      },
      animation: {
        float: 'float 10s ease-in-out infinite',
      },
      colors: {
        primary: "#4250EB",
        dark: "#0B0B0B",
        campaign: "#DC2626",
        "campaign-dark": "#B91C1C",
        "campaign-light": "#FEE2E2",
      },
      fontFamily: {
        'clash': ['Clash Display', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'sans': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
