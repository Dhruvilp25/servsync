/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Dark OLED "operations" theme (ui-ux-pro-max recommendation)
        bg: '#0F172A', // app background
        surface: '#111c33', // raised cards
        'surface-2': '#0c1526', // recessed wells
        muted: '#1e293b',
        line: '#243044', // subtle borders
        'line-soft': '#1b2638',
        fg: '#F8FAFC', // primary text
        'fg-muted': '#94a3b8', // secondary text
        'fg-dim': '#64748b',
        accent: {
          DEFAULT: '#22C55E', // "run" green
          fg: '#16a34a',
          soft: 'rgba(34, 197, 94, 0.12)',
        },
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(34, 197, 94, 0.35)',
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 30px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
