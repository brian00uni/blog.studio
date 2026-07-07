/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#03c75a", // 네이버 그린
          dark: "#02b44e",
        },
      },
    },
  },
  plugins: [],
};
