import { APP_SUBTITLE, APP_TAGLINE, APP_VERSION } from "../../theme/brand";

type AppFooterVariant = "compact" | "home";

interface AppFooterProps {
  variant?: AppFooterVariant;
}

export function AppFooter({ variant = "compact" }: AppFooterProps) {
  if (variant === "home") {
    return (
      <footer className="border-t border-brand-border bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold text-brand-navy">
              MEER ILYAS <span className="font-normal text-brand-muted">•</span>{" "}
              {APP_SUBTITLE}
            </p>
            <p className="mt-0.5 text-xs italic text-brand-muted">
              {APP_TAGLINE}
            </p>
          </div>

          <div className="hidden flex-col items-end gap-1 text-xs text-brand-muted md:flex">
            <span className="inline-flex items-center gap-1.5">
              <PhoneIcon />
              03338122268
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon />
              Muslim Road Main Market, Gujranwala
            </span>
          </div>

          <p className="shrink-0 text-xs text-brand-muted">{APP_VERSION}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-brand-border bg-white px-6 py-3">
      <div className="flex items-center justify-between gap-4 text-xs text-brand-muted">
        <p>
          <span className="font-bold text-brand-navy">MEER ILYAS</span>
          <span className="mx-1.5">•</span>
          {APP_SUBTITLE}
        </p>
        <p>{APP_VERSION}</p>
      </div>
    </footer>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
