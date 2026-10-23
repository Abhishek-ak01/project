/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f8f5',
          100: '#dfefe7',
          200: '#c1dfd1',
          300: '#95c7b3',
          400: '#64a990',
          500: '#418d73',
          600: '#2f715b',
          700: '#275a4a',
          800: '#22483c',
          900: '#1b3b32',
          950: '#0d211b',
        },
        cream: {
          50: '#fdfcf9',
          100: '#f9f7f2',
          200: '#f2eee3',
          300: '#e7e0cf',
          400: '#d7cbb6',
          500: '#bdad93',
        },
        charcoal: {
          50: '#f6f7f6',
          100: '#e2e5e3',
          200: '#c5cbc7',
          300: '#9fad9e',
          400: '#758774',
          500: '#586b57',
          600: '#445443',
          700: '#384437',
          800: '#2f392f',
          900: '#1c221c',
          950: '#111511',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        serif: ['Newsreader', 'Playfair Display', 'serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(17, 33, 27, 0.04)',
        'elevated': '0 8px 30px rgba(17, 33, 27, 0.08)',
        'glow': '0 0 25px rgba(47, 113, 91, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}
