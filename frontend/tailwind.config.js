/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // VMC Official Red Theme
        primary: {
          50: '#FFF5F5',
          100: '#FFE5E7',
          200: '#FFCCD0',
          300: '#FF99A2',
          400: '#FF3347', // Accent red
          500: '#E50914', // Primary red
          600: '#C90019', // Deep red
          700: '#A50014',
          800: '#7D000F',
          900: '#52000A',
        },
        // Neutral Slate / Gray
        slate: {
          50: '#FAFAFA',  // Background
          100: '#F3F4F6', // Light gray surface
          200: '#E5E7EB',
          300: '#D9DDE3', // Border gray
          400: '#94A3B8',
          500: '#64748B', // Secondary text
          600: '#475569',
          700: '#334155',
          800: '#1F2937',
          900: '#171717', // Main text
        },
        // Semantic aliases
        vmc: {
          red: '#E50914',
          deep: '#C90019',
          accent: '#FF3347',
          bg: '#FAFAFA',
          card: '#FFFFFF',
          light: '#F3F4F6',
          border: '#D9DDE3',
          text: '#171717',
          muted: '#64748B',
          green: '#059669',
          amber: '#F59E0B',
        },
        // Retain compatibility mappings without blues
        ink: {
          DEFAULT: '#171717',
          950: '#171717',
          900: '#1F2937',
          800: '#334155',
          700: '#475569',
        },
        chalk: {
          DEFAULT: '#FFFFFF',
          100: '#FAFAFA',
          200: '#F3F4F6',
        },
        gold: {
          DEFAULT: '#E50914',
          300: '#FF99A2',
          400: '#E50914',
          500: '#C90019',
        },
        mark: {
          DEFAULT: '#E50914',
        },
        steel: {
          DEFAULT: '#64748B',
          300: '#D9DDE3',
          400: '#94A3B8',
          500: '#64748B',
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'card-lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
        'red-glow': '0 4px 14px 0 rgba(229, 9, 20, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
