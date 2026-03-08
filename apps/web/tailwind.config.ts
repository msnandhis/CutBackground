import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{ts,tsx}",
        "./config/**/*.{ts,tsx}",
        "../../packages/ui/src/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    magenta: "#FF0076",
                    "magenta-hover": "#e0006a",
                    dark: "#12131A",
                    "dark-hover": "#1e1f2b",
                    light: "#f0faff",
                    success: "#10B981",
                },
                neutral: {
                    50: "#f6f6f7",
                    100: "#e1e1e3",
                    200: "#c3c3c7",
                    300: "#a5a5aa",
                    400: "#87878e",
                    500: "#696972",
                    600: "#54545b",
                    700: "#3f3f44",
                    800: "#2a2a2d",
                    900: "#151517",
                },
            },
            fontFamily: {
                heading: ["Quicksand", "sans-serif"],
                body: ["Inter", "sans-serif"],
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-out",
                "slide-up": "slideUp 0.5s ease-out",
                "hover-lift": "hoverLift 0.2s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                hoverLift: {
                    "0%": { transform: "translateY(0)" },
                    "100%": { transform: "translateY(-4px)" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
