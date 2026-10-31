/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#20221f",
        ash: "#6e736b",
        // GuzoMate Royal Blue & Warm Ivory Design Tokens
        primary: {
          DEFAULT: '#2555d9',
          dark: '#1b43b8',
          light: '#4d75e3',
          container: '#2555d9',
          fixed: '#e8efff',
        },
        'primary-container': '#2555d9',
        secondary: {
          DEFAULT: '#d97706',
          dark: '#904d00',
          light: '#fe932c',
          container: '#fe932c',
          fixed: '#ffdcc3',
        },
        'secondary-container': '#fe932c',
        'secondary-fixed': '#ffdcc3',
        tertiary: {
          DEFAULT: '#0e7490',
          dark: '#002b37',
          light: '#60b1cf',
        },
        surface: {
          DEFAULT: '#fbfaf4',
          dim: '#f0eee6',
          bright: '#fdfcf7',
          lowest: '#ffffff',
          low: '#f7f6ef',
          container: '#eeede4',
          'container-lowest': '#ffffff',
          'container-low': '#f7f6ef',
          'container-high': '#e6e4da',
          high: '#e6e4da',
          highest: '#dedcd2',
          variant: '#dedcd2',
        },
        'surface-container': '#eeede4',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f7f6ef',
        'surface-container-high': '#e6e4da',
        'on-surface': {
          DEFAULT: '#20221f',
          variant: '#555b55',
        },
        outline: {
          DEFAULT: '#839084',
          variant: '#e2e0d8',
        },
        forest: {
          50: '#f0f7f3',
          100: '#dceee3',
          200: '#bcdcc9',
          300: '#94c4a9',
          400: '#67a683',
          500: '#438763',
          600: '#2f6c4d',
          700: '#25563e',
          800: '#183a2b',
          900: '#0f2b1d',
          950: '#07170f',
        },
        brand: {
          50: '#eefdf5',
          100: '#d1fae5',
          500: '#1b4332',
          600: '#15382a',
          700: '#0f291f',
        },
        highland: {
          forest: '#1b4332',
          deep: '#012d1d',
          amber: '#d97706',
          gold: '#fe932c',
          teal: '#0e7490',
          mist: '#e8e8e3',
          stone: '#fafaf7',
          charcoal: '#1a1c19',
          clay: '#b45309',
        },
        status: {
          pending: '#d97706',  // Amber
          active: '#dc2626',   // Red
          resolved: '#16a34a', // Emerald Green
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Noto Sans Ethiopic', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        ethiopic: ['Noto Sans Ethiopic', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'stacked': '0 4px 6px -1px rgba(27, 67, 50, 0.05), 0 2px 4px -2px rgba(27, 67, 50, 0.05)',
        'floating': '0 20px 25px -5px rgba(27, 67, 50, 0.08), 0 8px 10px -6px rgba(27, 67, 50, 0.04)',
        'highland': '0 12px 24px -6px rgba(27, 67, 50, 0.08), 0 4px 8px -2px rgba(27, 67, 50, 0.04)',
        'glow': '0 0 20px rgba(24, 58, 43, 0.15)',
        'glow-amber': '0 0 20px rgba(217, 119, 6, 0.35)',
        'glow-emerald': '0 0 20px rgba(27, 67, 50, 0.35)',
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
