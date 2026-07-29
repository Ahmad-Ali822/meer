import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-navy text-white hover:bg-[#1c1960] focus-visible:ring-brand-navy/40 disabled:bg-brand-muted/40 disabled:text-white/80",
  secondary:
    "border border-brand-border bg-white text-brand-text hover:bg-brand-bg focus-visible:ring-brand-navy/20 disabled:text-brand-muted disabled:bg-brand-bg",
  ghost:
    "bg-transparent text-brand-muted hover:text-brand-navy focus-visible:ring-brand-navy/20",
  danger:
    "bg-brand-red text-white hover:bg-[#c9141c] focus-visible:ring-brand-red/40 disabled:bg-brand-muted/40 disabled:text-white/80",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        fullWidth ? "w-full" : "",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
