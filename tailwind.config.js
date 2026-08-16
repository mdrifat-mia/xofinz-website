/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./*.html",
    "./*.js"
  ],

  theme: {
    extend: {
      colors: {
        background: "#020617",
        section: "#0F172A",
        primary: "#2563EB",
        accent: "#60A5FA"
      },

      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    }
  },

  plugins: []
};