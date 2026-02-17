/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",           // Quét file ở thư mục gốc
    "./components/**/*.{js,ts,jsx,tsx}", // Quét file trong components
    "./services/**/*.{js,ts,jsx,tsx}",   // Quét file trong services
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}