/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light theme defaults (overridden by dark: variants)
        bg: {
          primary: "#ffffff",
          secondary: "#f8fafc",
          card: "#ffffff",
        },
        surface: {
          card: "#ffffff",
          elevated: "#f1f5f9",
        },
        border: {
          light: "#e2e8f0",
          medium: "#cbd5e1",
          focus: "#3b82f6",
        },
        text: {
          primary: "#0f172a",
          secondary: "#475569",
          muted: "#94a3b8",
          inverse: "#ffffff",
        },
        brand: {
          accent: "#3b82f6",      // Electric blue
          accentHover: "#2563eb", // Bright indigo
          accentSoft: "#eff6ff",  // Soft blue tint
          accentDark: "#1e40af",  // Deep blue for dark text on accent
        },
        profit: "#10b981",        // Fresh green
        profitSoft: "#ecfdf5",
        profitDark: "#047857",
        loss: "#ef4444",          // Coral red
        lossSoft: "#fef2f2",
        lossDark: "#b91c1c",
      },
      borderRadius: {
        card: "1rem",        // 16px
        btn: "0.75rem",      // 12px
        pill: "9999px",
      },
      fontSize: {
        "xs": ["0.75rem", { lineHeight: "1rem" }],
        "sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "base": ["1rem", { lineHeight: "1.5rem" }],
        "lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "xl": ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "financial-sm": ["0.875rem", { lineHeight: "1.25rem", fontVariantNumeric: "tabular-nums" }],
        "financial-base": ["1rem", { lineHeight: "1.5rem", fontVariantNumeric: "tabular-nums" }],
        "financial-lg": ["1.25rem", { lineHeight: "1.75rem", fontVariantNumeric: "tabular-nums" }],
        "financial-xl": ["1.5rem", { lineHeight: "2rem", fontVariantNumeric: "tabular-nums" }],
        "financial-2xl": ["1.875rem", { lineHeight: "2.25rem", fontVariantNumeric: "tabular-nums" }],
      },
      spacing: {
        "1.5": "0.375rem",
        "5.5": "1.375rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        cardHover: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
        modal: "0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      },
      transitionDuration: {
        "fast": "150ms",
        "normal": "250ms",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
