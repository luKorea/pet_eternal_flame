/** @type {import('tailwindcss').Config} */
// 色值来自 CSS 变量（由 AntdProvider 按 themeId 注入），fallback 为 light 主题
const v = (name) => `var(--theme-${name}, ${name === 'dark' ? '#f8fafc' : name === 'ink' ? '#ffffff' : name === 'paper' ? '#1e293b' : name === 'gold' ? '#0ea5e9' : name === 'red' ? '#dc2626' : '#e2e8f0'})`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        flame: {
          dark: v('dark'),
          ink: v('ink'),
          paper: v('paper'),
          gold: v('gold'),
          red: v('red'),
          gradientEnd: v('gradient-end'),
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
