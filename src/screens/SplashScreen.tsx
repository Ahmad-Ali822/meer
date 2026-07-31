import { useEffect } from "react";
import logo from "../assets/Logo.jpeg";
import { APP_SUBTITLE, APP_VERSION } from "../theme/brand";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2500);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative flex h-full flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <img
          src={logo}
          alt="Meer Ilyas logo"
          className="mb-6 h-auto w-44 max-w-full object-contain"
        />

        <h1 className="text-3xl font-bold tracking-wide text-brand-navy">
          MEER ILYAS
        </h1>
        <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-brand-navy">
          {APP_SUBTITLE.toUpperCase()}
        </p>
        <p className="mt-4 text-lg text-brand-muted">Invoice System</p>

        <div className="mt-8 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-navy" />
          <span className="h-2 w-2 rounded-full bg-brand-red" />
          <span className="h-2 w-2 rounded-full bg-brand-navy" />
        </div>
        <p className="mt-3 text-sm italic text-brand-muted">
          Starting application...
        </p>
      </div>

      <div className="px-6 pb-3">
        <div className="mb-3 flex items-center justify-end text-xs text-brand-muted">
          <span>{APP_VERSION}</span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full">
          <div className="flex-[9] bg-brand-navy" />
          <div className="flex-1 bg-brand-red" />
        </div>
      </div>
    </div>
  );
}
