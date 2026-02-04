/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: "#C8102E", hover: "#a30d25", light: "#f0d3d8" },
        secondary: { DEFAULT: "#1B1B2F", hover: "#2a2a45" },
        accent:    { DEFAULT: "#F5C518", hover: "#d4a915" },
        neutral:   { DEFAULT: "#F4F6F7", dark: "#E2E6E8" },
      },
    },
  },
  plugins: [],
}
