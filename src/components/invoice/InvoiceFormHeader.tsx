import { Button } from "../ui/Button";

interface InvoiceFormHeaderProps {
  onHome: () => void;
}

export function InvoiceFormHeader({ onHome }: InvoiceFormHeaderProps) {
  return (
    <header className="flex items-center justify-between bg-brand-navy px-5 py-3 text-white">
      <p className="text-sm font-bold tracking-wide">
        MEER ILYAS INVOICE SYSTEM
      </p>
      <Button
        variant="ghost"
        onClick={onHome}
        className="px-2 py-1.5 text-white hover:text-white/80"
      >
        <HomeIcon />
        Home
      </Button>
    </header>
  );
}

function HomeIcon() {
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
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
