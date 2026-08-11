/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141821",
        slate: {
          925: "#0f131a",
        },
        brand: {
          50: "#eef4ff",
          100: "#dce8ff",
          200: "#c2d7ff",
          400: "#5b8def",
          500: "#3568e0",
          600: "#274fc0",
          700: "#1f3d97",
        },
      },
      fontFamily: {
        display: ["'Sora'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
