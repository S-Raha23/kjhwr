import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f3f5f9',
          100: '#e3e8f0',
          200: '#c8d1e0',
          300: '#9aa7bd',
          400: '#6b7a94',
          500: '#4b5a75',
          600: '#364259',
          700: '#252f44',
          800: '#161e30',
          900: '#0b1220',
        },
        paper: '#f7f5ef',
        accent: {
          50: '#effcf9',
          100: '#cdf6ee',
          200: '#9aeadb',
          300: '#5fd6c4',
          400: '#2dbfaa',
          500: '#14a38f',
          600: '#0d8274',
          700: '#0f675d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,18,32,0.06), 0 12px 28px -16px rgba(11,18,32,0.18)',
      },
      keyframes: {
        wind: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-1400' },
        },
      },
      animation: {
        'wind-slow': 'wind 38s linear infinite',
        'wind-mid': 'wind 26s linear infinite',
        'wind-fast': 'wind 18s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
