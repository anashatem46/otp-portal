import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#17201b",
        field: "#f6f7f9",
        line: "#e3e7e4",
        moss: "#1f7448",
        coral: "#bf5d46",
        amber: "#b7791f",
        sky: "#256f8c"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(23, 32, 27, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
