/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1a1c19",
        ash: "#717973",
        // Highland Modern Design Tokens
        primary: {
          DEFAULT: '#1b4332',
          dark: '#012d1d',
          light: '#86af99',
          container: '#1b4332',
          fixed: '#c1ecd4',
        },
        'primary-container': '#1b4332',
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
          DEFAULT: '#fafaf4',
          dim: '#dadad5',
          bright: '#fafaf4',
          lowest: '#ffffff',
          low: '#f4f4ef',
          container: '#eeeee9',
          'container-lowest': '#ffffff',
          'container-low': '#f4f4ef',
          'container-high': '#e8e8e3',
          high: '#e8e8e3',
          highest: '#e3e3de',
          variant: '#e3e3de',
        },
        'surface-container': '#eeeee9',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f4f4ef',
        'surface-container-high': '#e8e8e3',
        'on-surface': {
          DEFAULT: '#1a1c19',
          variant: '#414844',
        },
        outline: {
          DEFAULT: '#717973',
          variant: '#c1c8c2',
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
        sans: ['Plus Jakarta Sans', 'Inter', 'Noto Sans Ethiopic', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        ethiopic: ['Noto Sans Ethiopic', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'stacked': '0 4px 6px -1px rgba(27, 67, 50, 0.05), 0 2px 4px -2px rgba(27, 67, 50, 0.05)',
        'floating': '0 20px 25px -5px rgba(27, 67, 50, 0.08), 0 8px 10px -6px rgba(27, 67, 50, 0.04)',
        'highland': '0 12px 24px -6px rgba(27, 67, 50, 0.08), 0 4px 8px -2px rgba(27, 67, 50, 0.04)',
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
