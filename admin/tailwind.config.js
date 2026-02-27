module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'flame-dark': 'var(--theme-dark)',
        'flame-ink': 'var(--theme-ink)',
        'flame-paper': 'var(--theme-paper)',
        'flame-gold': 'var(--theme-gold)',
        'flame-red': 'var(--theme-error)',
        'flame-gradient-end': 'var(--theme-gradient-end)',
      },
    },
  },
  plugins: [],
}
