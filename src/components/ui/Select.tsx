import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className = "", id, children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label ? (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wide text-brand-muted"
        >
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={[
          "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 focus-visible:border-brand-navy",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
