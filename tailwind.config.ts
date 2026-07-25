import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: '#0b0c12', panel: '#151722', gold: '#d7ad62', mist: '#e9e2d4' } } }, plugins: [] };
export default config;
