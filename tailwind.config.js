/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        eden: {
          green:       '#1A6B3C',
          'green-light': '#2D9B5A',
          'green-mid':   '#4CAF7A',
          'green-pale':  '#E8F5EE',
          orange:      '#F47B20',
          'orange-light': '#FF9A45',
          'orange-pale':  '#FEF0E4',
          dark:        '#0D1F14',
          charcoal:    '#1C2E21',
          grey:        '#6B7E72',
          light:       '#F4F9F6',
        },
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm:   ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(26,107,60,0.10)',
        'card-lg': '0 12px 48px rgba(26,107,60,0.16)',
      },
    },
  },
  plugins: [],
}
