/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false, // Deshabilita el preflight de Tailwind para evitar conflictos con MUI CssBaseline
  },
  plugins: [],
};
