/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    fontFamily: {
      sans: [
        "Pretendard",
        "NanumSquareRoundOTF",
        "Apple SD Gothic Neo",
        "Noto Sans KR",
        "system-ui",
        "sans-serif",
      ],
      mono: [
        '"JetBrains Mono"',
        "ui-monospace",
        "SFMono-Regular",
        "monospace",
      ],
    },
    extend: {
      colors: {
        brand: {
          50: "#eefcf7",
          100: "#d4f6e8",
          200: "#adebd2",
          300: "#76dab5",
          400: "#3fc192",
          500: "#1dac79",
          600: "#12895f",
          700: "#0e6d4d",
          800: "#0e583f",
          900: "#0c4935",
        },
        "airflow-teal": {
          400: "#3A99F3",
          500: "#017CEE",
          600: "#0162BE",
        },
        "bg-dark": "#0B1118",
        "bg-paper": "#121A23",
      },
      boxShadow: {
        soft: "0 18px 40px rgba(7, 69, 49, 0.12)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
