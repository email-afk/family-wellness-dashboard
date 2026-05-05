import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#13201a",
        moss: "#526a4e",
        mint: "#dff0df",
        clay: "#b87955",
        coral: "#e78b75",
        skywash: "#dceaf7",
        paper: "#fbfaf7"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(31, 42, 32, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
