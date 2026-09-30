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
        // Soft Mint / Aqua Glassmorphism Theme
        'mint-bg': '#EAF7F5',
        'mint-secondary': '#D9F3EF',
        'mint-accent': '#12B8B0',
        'mint-accent-hover': '#0EA29B',
        'mint-pill': '#E1F6F3',
        'mint-pill-border': '#BCE8E2',
        'mint-border': '#D2EBE6',
        'mint-teal': '#0F766E',
        'mint-heading': '#134E4A',
        'mint-card': 'rgba(255, 255, 255, 0.85)',
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
          'from': { boxShadow: '0 0 10px rgba(18, 184, 176, 0.3)' },
          'to': { boxShadow: '0 0 20px rgba(18, 184, 176, 0.6), 0 0 40px rgba(18, 184, 176, 0.2)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
        'hero-gradient': 'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A1628 100%)',
        'mint-gradient': 'linear-gradient(135deg, #F8FCFB 0%, #EAF7F5 50%, #D9F3EF 100%)',
        'accent-gradient': 'linear-gradient(135deg, #12B8B0, #0EA29B)',
        'card-gradient': 'linear-gradient(135deg, rgba(18,184,176,0.12), rgba(217,243,239,0.25))',
      },
    },
  },
  plugins: [],
}
