import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#00A651",
        "primary-dark": "#0B3D2E",
        "background-dark": "#111111",
        "background-light": "#F5F5F5",
      },
      fontFamily: {
        heading: ["Bebas Neue", "sans-serif"],
        body: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
