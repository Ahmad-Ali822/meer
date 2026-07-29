import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  errorMessage?: string;
  trailing?: ReactNode;
}

export function Input({
  label,
  error = false,
  errorMessage,
  trailing,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-brand-text"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={[
            "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-text",
            "placeholder:text-brand-muted/70",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20",
            error
              ? "border-brand-error focus-visible:border-brand-error"
              : "border-brand-border focus-visible:border-brand-navy",
            trailing ? "pr-10" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </div>
        ) : null}
      </div>
      {errorMessage ? (
        <p className="text-xs text-brand-error">{errorMessage}</p>
      ) : null}
    </div>
  );
}
