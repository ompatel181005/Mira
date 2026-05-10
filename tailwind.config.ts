import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '2rem', // The "Organic" look
      },
      colors: {
        brand: {
          50: "#f0f9ff",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
        // Softer, more modern teals/greens
        sage: {
          50: "#f4f7f6",
          100: "#e8efed",
          500: "#5d8a82",
          600: "#4a6e68",
        },
        medical: {
          50: "#f0fdfa",
          100: "#ccfbef",
          600: "#0d9488",
          700: "#0f766e",
        }
      },
      boxShadow: {
        'soft': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
export default config;