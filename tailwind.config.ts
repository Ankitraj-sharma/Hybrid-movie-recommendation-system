import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090C",
        card: "#12151D",
        cardHover: "#1B202D",
        accent: {
          DEFAULT: "#E50914",
          hover: "#B80710",
        },
        gold: "#FFB800",
        surface: "#1E2330",
        borderDark: "#232938",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 30px -5px rgba(229, 9, 20, 0.4)",
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.7)",
      },
    },
  },
  plugins: [],
} satisfies Config;
