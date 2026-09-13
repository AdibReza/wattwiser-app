"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, issuesToFieldErrors, loginSchema, safeNext, signupSchema } from "@/lib/validation/auth";

type Mode = "login" | "signup";

const COPY = {
  login: { submit: "Sign in", busy: "Signing in…", ok: "Signed in", failed: "Not signed in" },
  signup: { submit: "Create account", busy: "Creating account…", ok: "Account created", failed: "Not created" },
} as const;

/** A password box with its own show/hide toggle. Used twice on the sign-up screen. */
function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          className="pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex items-center rounded-md px-3 text-muted-foreground outline-ring/50 hover:text-foreground focus-visible:outline-2"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
      {!error && hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </Field>
  );
}

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const copy = COPY[mode];

  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  type FormKey = keyof typeof form;
  const set = (key: FormKey, value: string) => setForm((f) => ({ ...f, [key]: value }));

  function fail(message: string) {
    setSubmitError(message);
    // Move focus to the message so it is not missed by keyboard or screen reader.
    requestAnimationFrame(() => alertRef.current?.focus());
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // Both schemas are strict, so the login schema must not be shown confirmPassword.
    const parsed =
      mode === "login"
        ? loginSchema.safeParse({ email: form.email, password: form.password })
        : signupSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setBusy(true);

    try {
      const { email, password } = parsed.data;
      const { error } =
        mode === "login"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({
              email,
              password,
              // Better Auth requires a name. We don't ask for one — nothing in
              // WattWiser shows it — so derive something harmless from the email.
              name: email.split("@")[0].slice(0, 80),
            });

      if (error) {
        fail(authErrorMessage(error.code, mode));
        return;
      }

      toast.success(copy.ok);
      router.push(safeNext(next));
      router.refresh(); // the (app) layout caches the session; make it re-read
    } catch {
      fail("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const err = (key: string) => (errors[key] ? <FieldError id={`${key}-error`}>{errors[key]}</FieldError> : null);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {err("email")}
        </Field>

        <PasswordField
          id="password"
          label="Password"
          value={form.password}
          onChange={(v) => set("password", v)}
          // "new-password" lets a password manager offer to generate one.
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          error={errors.password}
          hint={mode === "signup" ? "At least 8 characters." : undefined}
        />

        {mode === "signup" ? (
          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            value={form.confirmPassword}
            onChange={(v) => set("confirmPassword", v)}
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
        ) : null}
      </FieldGroup>

      {submitError ? (
        <Alert variant="destructive" role="alert" tabIndex={-1} ref={alertRef}>
          <AlertTitle>{copy.failed}</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? copy.busy : copy.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
