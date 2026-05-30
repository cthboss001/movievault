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
        ink: "#121417",
        paper: "#f7f4ef",
        vault: "#2f5d50",
        ember: "#d96c3b"
      },
      boxShadow: {
        soft: "0 20px 60px rgb(18 20 23 / 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
