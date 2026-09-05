/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0A0F1E',
        'bg-secondary': '#0D1528',
        'accent-green': '#10B981',
        'accent-teal': '#14B8A6',
        'accent-emerald': '#059669',
        'glass-white': 'rgba(255,255,255,0.05)',
        'glass-border': 'rgba(255,255,255,0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' },
          'to': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.2)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
        'hero-gradient': 'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A1628 100%)',
        'accent-gradient': 'linear-gradient(135deg, #10B981, #14B8A6)',
        'card-gradient': 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(20,184,166,0.05))',
      },
    },
  },
  plugins: [],
}
