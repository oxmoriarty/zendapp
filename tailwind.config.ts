import type { Config } from "tailwindcss";

// Zendapp design system
// Brand core: #31028f (Zen Violet), #000000, #FFFFFF
// Every other color in the palette is derived from these three so the
// app never introduces a competing hue.
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
          sunken: "hsl(var(--surface-sunken))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#f4edff",
          100: "#e7d9ff",
          200: "#cdb2ff",
          300: "#ab82ff",
          400: "#8748f5",
          500: "#6a1fe0",
          600: "#5211c4",
          700: "#3f0da0",
          800: "#31028f",
          900: "#22015f",
          950: "#150140",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "#16a34a",
          foreground: "#ffffff",
          soft: "#e7f7ed",
        },
        warning: {
          DEFAULT: "#b45309",
          foreground: "#ffffff",
          soft: "#fdf1e0",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2.25rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgb(20 10 50 / 0.06), 0 8px 24px -8px rgb(20 10 50 / 0.08)",
        elevated: "0 4px 16px -4px rgb(20 10 50 / 0.10), 0 16px 48px -12px rgb(20 10 50 / 0.14)",
        glow: "0 0 0 1px rgb(49 2 143 / 0.08), 0 8px 32px -8px rgb(49 2 143 / 0.35)",
      },
      backgroundImage: {
        "zen-gradient": "linear-gradient(135deg, #3f0da0 0%, #31028f 45%, #150140 100%)",
        "zen-radial": "radial-gradient(120% 120% at 20% 0%, #5211c4 0%, #31028f 40%, #0d0026 100%)",
        "zen-mesh": "radial-gradient(60% 60% at 10% 10%, rgba(171,130,255,0.35), transparent), radial-gradient(50% 50% at 90% 20%, rgba(82,17,196,0.35), transparent), radial-gradient(70% 70% at 50% 100%, rgba(49,2,143,0.4), transparent)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-700px 0" }, "100%": { backgroundPosition: "700px 0" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.8s infinite linear",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
