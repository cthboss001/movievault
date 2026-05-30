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
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif"
        ]
      },
      boxShadow: {
        soft: "0 20px 60px rgb(18 20 23 / 0.10)"
      },
      borderOpacity: {
        "6": "0.06",
        "8": "0.08"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out"
      }
    }
  },
  plugins: []
};

export default config;
