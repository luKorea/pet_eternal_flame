/** @type {import('tailwindcss').Config} */
// 色值来自 src/theme/palette.js 唯一配置，与 Ant Design 主题一致
const palette = require('./src/theme/palette.js')

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        flame: {
          dark: palette.dark,
          ink: palette.ink,
          paper: palette.paper,
          gold: palette.gold,
          red: palette.red,
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
