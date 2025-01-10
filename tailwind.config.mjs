/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F05A7E',
        primaryDark: '#0B8494',
        secondary: '#125B9A',
        accent: '#FFBE98',
        teal: '#0B8494',
        peach: '#FFBE98',
        orange: '#F05A7E',
        pink: '#F05A7E',
        retro: '#FFBE98',
      },
    },
  },
  plugins: [],
};
