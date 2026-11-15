/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fog: '#e4e7ec', // light page
        ink: '#0c0f14', // dark text / dark sections, 16.9:1 on fog
        slate: '#4a5260', // secondary on fog, 6.7:1
        mist: '#9aa3b2', // secondary on ink, 7.6:1
        volt: '#2f45ff', // the accent: 6.0:1 on fog
        voltsoft: '#8c99ff', // accent on ink, 7.0:1
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans Variable"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { page: '86rem' },
    },
  },
  plugins: [],
}
