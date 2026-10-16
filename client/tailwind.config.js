export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        xs: '400px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Technical Workers brand: navy, blue and orange taken from the logo
        brand: {
          DEFAULT: '#1D4ED8',
          dark: '#0B1F3A',
          tint: '#E8EEFC',
        },
        accent: {
          DEFAULT: '#FF6B2C',
          text: '#C2410C',
        }, // use DEFAULT for fills and icons, text for orange words
        ink: {
          DEFAULT: '#0B1F3A',
          muted: '#5B6B88',
        },
        ground: '#F6F8FB',
        line: {
          DEFAULT: '#DCE3EF',
          strong: '#7A89A8',
        }, // strong = form borders (3:1 contrast)
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};