import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#702082",
          "purple-dark": "#5a1a6a",
          "purple-light": "#8b35a0",
          white: "#ffffff",
          grey: "#D3D3D3",
          "grey-dark": "#a0a0a0",
          "grey-bg": "#f5f5f5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
