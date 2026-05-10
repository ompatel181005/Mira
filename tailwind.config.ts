import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
        },
        teal: {
          50: "#ecfdf9",
          100: "#ccfbef",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
        },
      },
    },
  },
  plugins: [],
};
export default config;
