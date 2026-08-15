/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#1F2420',
        muted: '#5E675F',
        linen: '#F3F0E8',
        surface: '#FAF8F3',
        herb: {
          DEFAULT: '#4F6B4A',
          deep: '#3A5238',
        },
        sage: '#D8E0D0',
        line: '#DDD8CC',
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        sans: ['SourceSans3_400Regular'],
      },
    },
  },
  plugins: [],
};
