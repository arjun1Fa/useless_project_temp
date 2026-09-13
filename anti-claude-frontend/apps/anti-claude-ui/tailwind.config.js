/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dorm: {
          bg: '#0c0d12',
          card: '#161822',
          border: '#26293a',
          accent: '#ff3e3e',
          neon: '#00f0ff',
          warning: '#ffb703',
          caffeine: '#10b981',
          text: '#f1f5f9',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 2s infinite',
      }
    },
  },
  plugins: [],
}
