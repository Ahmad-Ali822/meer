import { FormEvent, useState } from "react";
import logo from "../assets/Logo.jpeg";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PasswordToggle } from "../components/ui/PasswordToggle";
import { verifyLogin } from "../services/authService";
import { APP_NAME } from "../theme/brand";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Invalid username or password");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedUsername = username.trim();

    if (!trimmedUsername || password.length === 0) {
      setErrorMessage("Invalid username or password");
      setShowError(true);
      return;
    }

    setIsSubmitting(true);
    setShowError(false);

    try {
      await verifyLogin(trimmedUsername, password);
      onLoginSuccess();
    } catch {
      setErrorMessage("Invalid username or password");
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-xl border border-brand-border/70 bg-white p-8 shadow-sm">
          <div className="mb-6 flex justify-center">
            <img
              src={logo}
              alt="Meer Ilyas logo"
              className="h-auto w-36 max-w-full object-contain"
            />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-brand-navy">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Enter your username and password
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <Input
              label="Username"
              placeholder=""
              autoComplete="username"
              value={username}
              error={showError}
              disabled={isSubmitting}
              onChange={(event) => {
                setUsername(event.target.value);
                if (showError) {
                  setShowError(false);
                }
              }}
            />

            <div className="space-y-1.5">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder=""
                autoComplete="current-password"
                value={password}
                error={showError}
                disabled={isSubmitting}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (showError) {
                    setShowError(false);
                  }
                }}
                trailing={
                  <PasswordToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                  />
                }
              />
              {showError ? (
                <p className="text-sm text-brand-error">{errorMessage}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              fullWidth
              className="mt-2 py-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
              <LoginIcon />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-brand-muted">
            Offline desktop application
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function LoginIcon() {
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
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" x2="3" y1="12" y2="12" />
    </svg>
  );
}
