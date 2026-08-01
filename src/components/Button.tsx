import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type Size = "md" | "lg" | "sm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-seal-500 text-paper hover:bg-seal-600 active:bg-seal-700 shadow-stamp",
  secondary: "bg-ink-light text-ink dark:bg-white/10 dark:text-ink-light hover:bg-ink-light/70 dark:hover:bg-white/20",
  ghost: "bg-transparent text-ink dark:text-ink-light hover:bg-ink/5 dark:hover:bg-white/10",
  danger: "bg-transparent text-seal-600 dark:text-seal-300 border border-seal-500/40 hover:bg-seal-50 dark:hover:bg-seal-500/10",
  gold: "bg-gold-500 text-ink hover:bg-gold-600 shadow-stamp",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-2 gap-1.5",
  md: "text-base px-4 py-3 gap-2",
  lg: "text-lg px-6 py-4 gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation select-none ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
