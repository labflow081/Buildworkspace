/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        xp: {
          blue:        '#2A5BA5',
          'blue-dark': '#1E4380',
          'blue-mid':  '#245299',
          beige:       '#ECE9D8',
          green:       '#4A8B2C',
          'green-mid': '#6FAB47',
          yellow:      '#E8B947',
          'yellow-lt': '#F5D77A',
          'yellow-dk': '#C99428',
          red:         '#E84444',
          'red-dark':  '#B81818',
          sky:         '#4A90D9',
          'sky-mid':   '#6BB6E8',
          'sky-lt':    '#8FCBF0',
          'hill-lt':   '#A8D88B',
          text:        '#1A1828',
          'text-sec':  '#666666',
          border:      '#7F9DB9',
        }
      },
      fontFamily: {
        tahoma: ["'Tahoma'", "'Geneva'", 'sans-serif'],
      },
      fontSize: {
        'xp-sm':   ['10px', '14px'],
        'xp-base': ['12px', '16px'],
        'xp-ui':   ['11px', '15px'],
        'xp-title':['11px', '16px'],
      }
    }
  },
  plugins: []
}
