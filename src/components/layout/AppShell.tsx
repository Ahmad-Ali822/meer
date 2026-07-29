import type { ReactNode } from "react";
import { AppFooter } from "../ui/AppFooter";
import { AppHeader } from "../ui/AppHeader";

interface AppShellProps {
  children: ReactNode;
  footerVariant?: "compact" | "home";
  showHeader?: boolean;
  onLogout?: () => void;
}

export function AppShell({
  children,
  footerVariant = "compact",
  showHeader = false,
  onLogout,
}: AppShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-brand-bg">
      {showHeader ? <AppHeader onLogout={onLogout} /> : null}
      <main className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</main>
      <AppFooter variant={footerVariant} />
    </div>
  );
}
