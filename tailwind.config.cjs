module.exports = {
  content: [
    './index.html',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './public/**/*.html',
  ],
  safelist: [
    { pattern: /./ },
  ],
  theme: {
    extend: {
      colors: {
        void: '#030712',
        glass: 'rgba(255, 255, 255, 0.05)',
        'glass-hover': 'rgba(255, 255, 255, 0.1)',
        vibe: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          900: '#0c4a6e',
          glow: '#00f3ff',
        },
        purple: {
          glow: '#bc13fe',
        },
        pink: {
          glow: '#ff0055',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow':
          'conic-gradient(from 180deg at 50% 50%, #0ea5e9 0deg, #bc13fe 180deg, #0ea5e9 360deg)',
      },
      animation: {
        blob: 'blob 7s infinite',
        float: 'float 6s ease-in-out infinite',
        'progress-glow': 'progress-glow 2s linear infinite',
      },
      keyframes: {
        'progress-glow': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};
