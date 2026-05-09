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
        warn: "#b45309"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
