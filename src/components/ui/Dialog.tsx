import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
}

export function Dialog({ open, title, children, footer, onClose }: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-brand-text/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-brand-border bg-white shadow-lg"
      >
        <div className="px-6 py-5">
          <div className="flex items-start gap-3">
            <WarningIcon />
            <div className="min-w-0 flex-1">
              <h2
                id="dialog-title"
                className="text-lg font-bold text-brand-text"
              >
                {title}
              </h2>
              <div className="mt-2 space-y-2 text-sm text-brand-muted">
                {children}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-brand-border bg-brand-bg/70 px-6 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

function WarningIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-brand-red text-brand-red">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" x2="12" y1="9" y2="13" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
      </svg>
    </span>
  );
}
