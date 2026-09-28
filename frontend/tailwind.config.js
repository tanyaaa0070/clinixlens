/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Accent (Lavender / Periwinkle)
        clinical: {
          50: '#f5f0ff',
          100: '#ede5ff',
          200: '#ddd0fe',
          300: '#c4b0fd',
          400: '#a78bfa',
          500: '#8b6cf7',
          600: '#7c53ec',
          700: '#6a3fd4',
          800: '#5835ad',
          900: '#4a2e8c',
          950: '#2d1a5e',
        },
        // Warm Neutral Milk & Cream Palette
        milk: {
          50: '#fefcf9',
          100: '#fdf9f3',
          200: '#f8f3ea',
          300: '#f1ead9',
          400: '#e6dcc8',
          500: '#d2c5ae',
        },
        // Category & Status Accents
        pastel: {
          lavender: {
            50: '#f9f5ff',
            100: '#f3ebfe',
            200: '#e8d9fd',
            300: '#d5befc',
            400: '#b899f9',
            500: '#9d72f5',
          },
          mint: {
            50: '#f0faf5',
            100: '#dcf6eb',
            200: '#bcedd8',
            300: '#8edebe',
            400: '#58c99e',
            500: '#33af82',
            600: '#258d69',
          },
          peach: {
            50: '#fff5f0',
            100: '#ffe8de',
            200: '#ffd4c0',
            300: '#ffb899',
            400: '#ff9468',
            500: '#f5713d',
          },
          rose: {
            50: '#fff2f5',
            100: '#ffe2ea',
            200: '#fecad8',
            300: '#fda4bd',
            400: '#f97698',
            500: '#ed4b74',
          },
          lemon: {
            50: '#fefef0',
            100: '#fefcd6',
            200: '#fdf7a0',
            300: '#fbed60',
            400: '#f8dd28',
            500: '#e8c410',
          },
          sky: {
            50: '#f0f7ff',
            100: '#e0efff',
            200: '#bfdffe',
            300: '#93cbfd',
            400: '#60b0fb',
            500: '#3a92f5',
          },
        },
        // Dark Theme Surface Tones
        slate: {
          850: '#161926',
          900: '#12141f',
          950: '#0c0d15',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 16px -2px rgba(139, 108, 247, 0.06), 0 1px 4px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 12px 32px -4px rgba(139, 108, 247, 0.10), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
        'pastel': '0 8px 24px -4px rgba(139, 108, 247, 0.14)',
        'pastel-mint': '0 8px 24px -4px rgba(51, 175, 130, 0.14)',
        'pastel-peach': '0 8px 24px -4px rgba(245, 113, 61, 0.14)',
        'pastel-rose': '0 8px 24px -4px rgba(237, 75, 116, 0.14)',
        'glow-lavender': '0 0 24px -2px rgba(139, 108, 247, 0.25)',
        'glow-mint': '0 0 24px -2px rgba(51, 175, 130, 0.25)',
        'glow-blue': '0 0 24px -2px rgba(139, 108, 247, 0.25)',
        'glow-teal': '0 0 24px -2px rgba(51, 175, 130, 0.25)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
