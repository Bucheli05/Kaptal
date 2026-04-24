/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B4332',
          950: '#0F281E',
        },
        terracotta: {
          50: '#FDF2EC',
          100: '#FAE4D7',
          200: '#F5C9AE',
          300: '#F0AE85',
          400: '#EB936C',
          500: '#E07A5F',
          600: '#D4624B',
          700: '#C44A37',
          800: '#A43B2F',
          900: '#7A2E26',
        },
        cream: '#F4F1DE',
        coffee: {
          50: '#F2F2F4',
          100: '#E0E0E5',
          200: '#C2C2CB',
          300: '#9E9EAB',
          400: '#7A7A8B',
          500: '#5E5E6F',
          600: '#4A4A5A',
          700: '#3D405B',
          800: '#2E3046',
          900: '#1F2130',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        'blob': '60% 40% 30% 70% / 60% 30% 70% 40%',
      },
      animation: {
        'blob': 'blob 7s infinite',
        'grow-up': 'growUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        growUp: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
