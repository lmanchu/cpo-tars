/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: ["./**/*.tsx"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          500: '#667eea',
          700: '#4c51bf',
        }
      }
    },
  },
  plugins: [],
  // prefix: "bbr-",
}

