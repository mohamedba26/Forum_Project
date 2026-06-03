/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#dce6fd',
          200: '#baccfb',
          300: '#89a9f8',
          400: '#567df4',
          500: '#3358ee',
          600: '#2240d3',
          700: '#1b31ab',
          800: '#1c2d8a',
          900: '#1a296e',
        },
        neutral: {
          50:  '#f8f8f7',
          100: '#f0efed',
          200: '#e2e0dc',
          300: '#cbc8c2',
          400: '#a8a49d',
          500: '#888480',
          600: '#6e6a66',
          700: '#5a5754',
          800: '#4a4845',
          900: '#3e3c3a',
          950: '#1e1d1b',
        },
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        sm: '0 1px 3px 0 rgba(0,0,0,0.06)',
        md: '0 4px 12px 0 rgba(0,0,0,0.08)',
        lg: '0 8px 24px 0 rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}
