import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ecf7ff",
          100: "#d5edff",
          200: "#aad8ff",
          300: "#7fc2ff",
          400: "#54adff",
          500: "#2a97ff",
          600: "#0078e6",
          700: "#005bb4",
          800: "#003f82",
          900: "#002451"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
