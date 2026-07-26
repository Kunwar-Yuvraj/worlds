/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vscode: {
          bg: '#07090f',
          sidebar: '#0c1019',
          editor: '#0a0e17',
          activitybar: '#090c14',
          statusbar: '#0c1019',
          hover: '#171e2f',
          active: '#1d2540',
          border: 'rgba(241, 244, 255, 0.1)',
          input: '#111725',
          text: '#f7f8fc',
          muted: '#7f8799',
          accent: '#8b7cff',
          accentHover: '#a99dff',
          panel: '#111725',
        },
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Segoe UI Variable', 'Inter', 'Geist', 'SF Pro Display', 'system-ui', 'sans-serif'],
        serif: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
      },
      boxShadow: {
        spectral: '0 30px 90px rgba(0,0,0,.38), inset 0 1px rgba(255,255,255,.025)',
      },
    },
  },
  plugins: [],
};
