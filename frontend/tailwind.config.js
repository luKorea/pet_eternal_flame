/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        flame: {
          dark: '#0f172a',
          ink: '#1e293b',
          paper: '#e2e8f0',
          gold: '#14b8a6',
          red: '#dc2626',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
