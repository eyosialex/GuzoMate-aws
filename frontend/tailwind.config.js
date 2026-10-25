/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17231c",
        ash: "#55685d",
        forest: {
          50: '#f0f7f3',
          100: '#dceee3',
          200: '#bcdcc9',
          300: '#94c4a9',
          400: '#67a683',
          500: '#438763',
          600: '#2f6c4d',
          700: '#25563e',
          800: '#183a2b', // Main brand primary in UI reference images
          900: '#0f2b1d',
          950: '#07170f',
        },
        brand: {
          50: '#f0f7f3',
          100: '#dceee3',
          500: '#2f6c4d',
          600: '#183a2b',
          700: '#0f2b1d',
        },
        status: {
          pending: '#d97706',  // Amber
          active: '#dc2626',   // Red
          resolved: '#16a34a', // Emerald Green
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'stacked': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'floating': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(24, 58, 43, 0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
