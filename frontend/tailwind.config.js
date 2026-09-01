/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#1e3a8a",       // Primary Gov Navy Blue (deep blue)
          navyalt: "#172554",    // Darker Navy
          gold: "#b45309",       // Accent Gold / Orange (MPLADS title / buttons)
          lightgold: "#fef3c7",  // Gold background highlight
          bg: "#f4f6f9",         // Warm light grey/blue background from screenshot
          card: "#ffffff",       // White card background
          border: "#e2e8f0",     // Light borders
          text: "#1e293b",       // Slate 800 body text
          muted: "#64748b",      // Slate 500 subtext
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'ui-serif', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
