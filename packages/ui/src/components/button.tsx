import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
}

export function Button({
    variant = "primary",
    size = "md",
    children,
    className = "",
    ...props
}: ButtonProps) {
    const baseStyles =
        "inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants: Record<string, string> = {
        primary:
            "bg-[#FF0076] text-white hover:bg-[#e0006a] focus:ring-[#FF0076] shadow-lg hover:shadow-xl",
        secondary:
            "bg-[#12131A] text-white hover:bg-[#1e1f2b] focus:ring-[#12131A]",
        outline:
            "border-2 border-[#FF0076] text-[#FF0076] hover:bg-[#FF0076] hover:text-white focus:ring-[#FF0076]",
    };

    const sizes: Record<string, string> = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
