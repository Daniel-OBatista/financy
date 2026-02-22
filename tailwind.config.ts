import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#124B2B",
          base: "#1F6F43",
        },

        gray: {
          800: "#111827",
          700: "#374151",
          600: "#4B5563",
          500: "#6B7280",
          400: "#9CA3AF",
          300: "#D1D5DB",
          200: "#E5E7EB",
          100: "#F8F9FA",
        },

        // (opcional) caso você queira manter o “typo” do figma também
        grau: { 500: "#6B7280" },

        blue: { dark: "#1D4ED8", base: "#2563EB", light: "#DBEAFE" },
        purple: { dark: "#7E22CE", base: "#9333EA", light: "#F3E8FF" },
        pink: { dark: "#BE185D", base: "#DB2777", light: "#FCE7F3" },
        red: { dark: "#B91C1C", base: "#DC2626", light: "#FEE2E2" },
        orange: { dark: "#C2410C", base: "#EA580C", light: "#FFEDD5" },
        yellow: { dark: "#A16207", base: "#CA8A04", light: "#F7F3CA" },
        green: { dark: "#15803D", base: "#16A34A", light: "#E0FAE9" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;