import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        field: "#f4f6f3",
        line: "#d9dfd6",
        moss: "#355e43",
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
