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
        'brand-navy': '#152132',
        'brand-navy-light': '#212938',
        'brand-amber': '#fbbf24',
        'brand-amber-deep': '#f59e0b',
        'brand-border': '#30363d',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
