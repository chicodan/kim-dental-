/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        "brand-purple": "#3c3456",
        "brand-light": "#f4f1ec",
        "accent-teal": "#3b6e8a",
        "accent-teal-dark": "#2d5567",
        ink: "#232129",
        "ink-weak": "#514d5d",
        "cream-2": "#e9e3da",
        "accent-gold": "#c2a661",
        "accent-gold-dark": "#9c854e",
        "accent-terracotta": "#b8695b",
        "accent-terracotta-dark": "#9a5347",
        "accent-sage": "#6f8d7a",
        "accent-sage-dark": "#597164",
        "accent-lavender": "#7a6ea8",
        "accent-lavender-dark": "#635a8a",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        heading: ["Playfair Display", "Georgia", "Times New Roman", "serif"],
        serif: ["Playfair Display", "Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".section-breakout": {
          width: "100vw",
          position: "relative",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
        },
        ".section-container": {
          maxWidth: "72rem", // 1152px (max-w-6xl)
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "1rem", // px-4
          paddingRight: "1rem",
        },
      });
    },
  ],
};
