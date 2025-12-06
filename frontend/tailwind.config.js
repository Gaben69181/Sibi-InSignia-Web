/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"],
        display: ["Orbitron", "Inter", "system-ui", "Segoe UI"],
        press: ["\"Press Start 2P\"", "cursive"],
      },
      keyframes: {
        "gradient-move": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "glow-pulse": {
          "0%":   { boxShadow: "0 0 0 1px rgba(99,102,241,0.35), 0 0 18px rgba(99,102,241,0.20)" },
          "50%":  { boxShadow: "0 0 0 1px rgba(99,102,241,0.55), 0 0 36px rgba(99,102,241,0.40)" },
          "100%": { boxShadow: "0 0 0 1px rgba(99,102,241,0.35), 0 0 18px rgba(99,102,241,0.20)" },
        },
      },
      animation: {
        "gradient-slow": "gradient-move 12s ease-in-out infinite",
        glow: "glow-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}

