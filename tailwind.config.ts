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
        // Serenity Flow Palette
        navy: {
          DEFAULT: "#011627",
          50: "#e8eaed",
          100: "#c5c9ce",
          200: "#9fa5ad",
          300: "#79828c",
          400: "#5e6670",
          500: "#3d4852",
          600: "#2c3640",
          700: "#1b242e",
          800: "#011627",
          900: "#000d15",
        },
        gold: {
          DEFAULT: "#C5A059",
          50: "#f9f5ed",
          100: "#f2e8d6",
          200: "#e6d5ad",
          300: "#d9c184",
          400: "#cfb064",
          500: "#C5A059",
          600: "#9a7d47",
          700: "#6f5933",
          800: "#44351f",
          900: "#19110b",
        },
        pearl: {
          DEFAULT: "#F5F5F0",
          50: "#ffffff",
          100: "#fafaf8",
          200: "#f5f5f0",
          300: "#ebebe6",
          400: "#d9d9d2",
          500: "#c7c7be",
        },
        // Legacy colors (mapped to new palette)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#011627",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#C5A059",
          foreground: "#011627",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#F5F5F0",
          foreground: "#011627",
        },
        accent: {
          DEFAULT: "#C5A059",
          foreground: "#011627",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#011627",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#011627",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Paper effect shadows
        "paper": "0 2px 8px rgba(1, 22, 39, 0.08)",
        "paper-lg": "0 8px 24px rgba(1, 22, 39, 0.12)",
        "paper-xl": "0 16px 48px rgba(1, 22, 39, 0.16)",
        // Subtle gold accent shadow
        "gold": "0 2px 8px rgba(197, 160, 89, 0.25)",
      },
      animation: {
        "scan": "scan 1.5s ease-in-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        scan: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "50%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.05)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
