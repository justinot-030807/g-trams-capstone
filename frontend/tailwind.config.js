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
        // 1. BRAND TOKENS (Sidebar, primary buttons, active nav only)
        brand: {
          maroon: '#9E2A2B',
          'maroon-hover': '#7A1B22',
          'maroon-dark': '#7A1B22',
          'maroon-subtle': '#FDF2F4',
          gold: '#D4AF37', // Accent borders and dots only; never body text on light surfaces
        },
        // Backward-compatible aliases for existing components
        maroon: {
          50: '#FDF2F4',
          100: '#FCE7EA',
          200: '#F8C5CA',
          light: '#B83D40',
          DEFAULT: '#9E2A2B',
          hover: '#7A1B22',
          dark: '#7A1B22',
        },
        gold: {
          light: '#F4D03F',
          DEFAULT: '#D4AF37',
        },

        // 2. NEUTRAL TOKENS (Warm government palette)
        neutral: {
          bg: '#F6F5F3',          // Canvas / page background (light)
          surface: '#FFFFFF',     // Cards / panels (light)
          border: '#E4E1DC',      // 1px subtle card/table border (light)
          text: '#1F1D1B',        // Primary text (light, WCAG 14:1+)
          muted: '#6B6761',       // Muted secondary copy (light, WCAG 4.6:1+)

          // Warm dark palette (no pure black)
          'bg-dark': '#14110F',
          'surface-dark': '#1C1917',
          'border-dark': '#2E2A27',
          'text-dark': '#F6F5F3',
          'muted-dark': '#A8A29E',
        },

        // 3. STATUS TOKENS (Strictly 4 semantic states with WCAG AA compliance)
        status: {
          // Active = Green
          'active-text': '#15803D',
          'active-bg': '#F0FDF4',
          'active-border': '#BBF7D0',
          'active-dark-text': '#4ADE80',
          'active-dark-bg': '#052E16',
          'active-dark-border': '#166534',

          // In-Progress (Pending, For Signing, Ready for Pickup) = Amber
          'progress-text': '#B45309',
          'progress-bg': '#FFFBEB',
          'progress-border': '#FDE68A',
          'progress-dark-text': '#FBBF24',
          'progress-dark-bg': '#451A03',
          'progress-dark-border': '#92400E',

          // Danger (Expired, Revoked) = Red
          'danger-text': '#B91C1C',
          'danger-bg': '#FEF2F2',
          'danger-border': '#FECACA',
          'danger-dark-text': '#F87171',
          'danger-dark-bg': '#450A0A',
          'danger-dark-border': '#991B1B',

          // Neutral (Cancelled, Draft, Empty) = Gray
          'neutral-text': '#4B5563',
          'neutral-bg': '#F3F4F6',
          'neutral-border': '#E5E7EB',
          'neutral-dark-text': '#9CA3AF',
          'neutral-dark-bg': '#1F2937',
          'neutral-dark-border': '#374151',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
      },
    },
  },
  plugins: [],
}