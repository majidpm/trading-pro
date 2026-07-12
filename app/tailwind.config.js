/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // غیرفعال کردن فوکوس رینگ
  corePlugins: {
    ringWidth: false,
    ringOffsetWidth: false,
    ringColor: false,
    ringOpacity: false,
    ringOffsetColor: false,
    
  },
}