/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        // Añade un sistema de grilla de 24 columnas
        '24': 'repeat(24, minmax(0, 1fr))',
      },
      gridColumn: {
        // Extiende para permitir spans de hasta 24
        'span-13': 'span 13 / span 13',
        'span-14': 'span 14 / span 14',
        'span-15': 'span 15 / span 15',
        // Continúa según sea necesario hasta 'span-24'
        'span-23': 'span 23 / span 23',
        'span-24': 'span 24 / span 24',
      },
      gridColumnStart: {
        // Extiende para permitir el inicio de columnas hasta 24
        '13': '13',
        '14': '14',
        // Continúa según sea necesario hasta '24'
        '23': '23',
        '24': '24',
      },
      gridColumnEnd: {
        // Extiende para permitir el fin de columnas hasta 24
        '13': '13',
        '14': '14',
        // Continúa según sea necesario hasta '24'
        '23': '23',
        '24': '24',
      }
    },
  },
  plugins: [],
}
