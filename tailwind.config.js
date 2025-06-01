/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'content-bg': '#1E2128',
        'border': '#343741',
        'banner': '#FFFFFF',
        'divider': '#A1A1A1',
        'button-blue': '#1878B9',
        'button-green': '#469B3B',
        'footer-divider': '#343741',
        'text': '#FFFFFF',
        'link': '#4693D1',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
