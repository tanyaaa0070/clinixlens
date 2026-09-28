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
        // Primary Brand Clinical Accent (Crisp Indigo / Navy)
        clinical: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Clean Neutral Slate Palette
        milk: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
        },
        // Clinical Category & Status Accents
        pastel: {
          neutral: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
          },
          cream: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#f1f5f9',
            300: '#e2e8f0',
            400: '#cbd5e1',
            500: '#94a3b8',
          },
          lavender: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
          },
          mint: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
          },
          peach: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
          },
          rose: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            300: '#fda4af',
            400: '#fb7185',
            500: '#f43f5e',
          },
          lemon: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308',
          },
          sky: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
          },
        },
        // Dark Theme Surface Tones
        slate: {
          850: '#151b28',
          900: '#0f172a',
          950: '#090d16',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'pastel': '0 4px 14px 0 rgba(99, 102, 241, 0.12)',
        'pastel-mint': '0 4px 14px 0 rgba(16, 185, 129, 0.12)',
        'pastel-peach': '0 4px 14px 0 rgba(245, 158, 11, 0.12)',
        'pastel-rose': '0 4px 14px 0 rgba(244, 63, 94, 0.12)',
        'glow-lavender': '0 0 20px -2px rgba(99, 102, 241, 0.20)',
        'glow-mint': '0 0 20px -2px rgba(16, 185, 129, 0.20)',
        'glow-blue': '0 0 20px -2px rgba(14, 165, 233, 0.20)',
        'glow-teal': '0 0 20px -2px rgba(20, 184, 166, 0.20)',
      },
      borderRadius: {
        '2.5xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
