import { APP_NAME } from "../../theme/brand";
import { Button } from "./Button";

interface AppHeaderProps {
  onLogout?: () => void;
}

export function AppHeader({ onLogout }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-brand-border bg-[#e8eaf3] px-5 py-3">
      <div className="flex items-center gap-2.5 text-sm font-semibold text-brand-navy">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ccd1ff]">
          <InvoiceIcon />
        </span>
        <span>
          {APP_NAME}
          <span className="mx-2 font-normal text-brand-muted">|</span>
          Invoice System
        </span>
      </div>

      {onLogout ? (
        <Button variant="ghost" onClick={onLogout} className="px-2 py-1.5">
          <LogoutIcon />
          Logout
        </Button>
      ) : null}
    </header>
  );
}

function InvoiceIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand-navy"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
      <path d="M7 7h10M7 11h6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
