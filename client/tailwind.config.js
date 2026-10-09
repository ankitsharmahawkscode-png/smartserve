export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { DEFAULT: '#0F766E', dark: '#0B5A54', tint: '#E3F2EF' },
        accent: '#B45309',
        ink: { DEFAULT: '#14211F', muted: '#4A5B58' },
        ground: '#F6F7F5',
        line: '#DDE3E1',
      },
      borderRadius: { card: '16px' },
    },
  },
  plugins: [],
};
