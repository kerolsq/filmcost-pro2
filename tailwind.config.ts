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
        ink: "#111827",
        panel: "#f8fafc",
        line: "#d9e2ec",
        accent: "#0f766e",
        warn: "#b45309",
        primary: {
          DEFAULT: '#0F6E56',
          dark: '#04342C',
          light: '#E1F5EE',
        },
        secondary: {
          DEFAULT: '#185FA5',
          dark: '#042C53',
        },
        warning: '#BA7517',
        danger: '#A32D2D',
      },
      boxShadow: {
        soft: "0 14px 40px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
