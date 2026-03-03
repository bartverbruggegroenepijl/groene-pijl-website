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
        // Legacy tokens (kept for admin compatibility)
        background: "var(--background)",
        foreground: "var(--foreground)",
        "background-dark": "#0D0D0D",
        "background-light": "#F5F5F5",

        // Brand palette
        primary: "#00FA61",
        "primary-dark": "#0B3D2E",
        accent: "#7B2FFF",
        "surface-1": "#141414",
        "surface-2": "#1C1C1C",
        "surface-3": "#242424",
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
        heading: ["Montserrat", "sans-serif"],
        body: ["Montserrat", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #00FA61 0%, #7B2FFF 100%)",
        "gradient-brand-reverse": "linear-gradient(135deg, #7B2FFF 0%, #00FA61 100%)",
        "gradient-hero": "linear-gradient(135deg, rgba(0,250,97,0.08) 0%, rgba(123,47,255,0.12) 100%)",
      },
      boxShadow: {
        "glow": "0 0 24px rgba(0, 250, 97, 0.35)",
        "glow-lg": "0 0 48px rgba(0, 250, 97, 0.25)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.6)",
      },
      maxWidth: {
        "8xl": "1440px",
      },
    },
  },
  plugins: [],
};
export default config;
