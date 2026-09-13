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
        brand: {
          DEFAULT: "#ff5500",
          amber: "#ff6200",
          ember: "#ff4500",
          copper: "#c25e1a",
          bronze: "#8c3e10",
          dim: "rgba(255, 85, 0, 0.12)",
          glow: "rgba(255, 85, 0, 0.25)",
        },
        surface: "#131315",
        "surface-dim": "#131315",
        "surface-bright": "#39393b",
        "surface-container-lowest": "#0e0e10",
        "surface-container-low": "#1b1b1d",
        "surface-container": "#201f21",
        "surface-container-high": "#2a2a2c",
        "surface-container-highest": "#353437",
        "on-surface": "#e5e1e4",
        "on-surface-variant": "#e5beb2",
        outline: "#ac897e",
        "outline-variant": "#5c4037",
        primary: "#ffb59c",
        "primary-container": "#ff5708",
        secondary: "#ffb599",
        "secondary-container": "#f66018",
        tertiary: "#c6c6c7",
      },
      fontFamily: {
        headline: ["Raleway", "sans-serif"],
        display: ["Raleway", "sans-serif"],
        body: ["Playfair Display", "serif"],
        label: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "monospace"],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'floating 7s ease-in-out infinite',
        'spin-slow': 'spin 26s linear infinite',
        'ripple': 'ripple 3.5s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        floating: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-8px) scale(1.02)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.85)', opacity: '0.8' },
          '50%': { transform: 'scale(1.15)', opacity: '0.3' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
