/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        primaryFg: "rgb(var(--primaryFg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",

        // ✅ Financy
        financy: {
          bg: "#F7FCFB",
          primary: "#2F855A",
          primaryHover: "#276749",
          ring: "rgba(47, 133, 90, 0.18)",
          border: "#E7EFEC",
          text: "#0F172A",
          muted: "#64748B",
        },
      },
      boxShadow: {
        financy: "0 10px 30px rgba(15, 23, 42, 0.06)",
        financySm: "0 6px 18px rgba(15, 23, 42, 0.05)",
      },
      borderRadius: {
        financy: "18px",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};