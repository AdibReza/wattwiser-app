/**
 * Sign-in and sign-up input. Shared by the form (inline errors) and, through
 * Better Auth's own server-side rules, by the API.
 *
 * Deliberately loose on password shape: the real gate is `minPasswordLength: 8`
 * in lib/auth.ts. Adding uppercase/symbol rules here would create a second,
 * drifting source of truth and makes accounts harder to create for no real gain.
 */
import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.email({ error: "Enter your email address" }).trim().toLowerCase(),
    password: z.string().min(1, "Enter your password"),
  })
  .strict();

export const signupSchema = z
  .object({
    email: z.email({ error: "Enter your email address" }).trim().toLowerCase(),
    password: z.string().min(8, "Use at least 8 characters").max(128, "That's too long"),
    confirmPassword: z.string().min(1, "Re-enter your password"),
  })
  .strict()
  // There is no password reset in this MVP — no mail server exists — so a typo
  // in the only password field would lock someone out of their own home for good.
  .refine((v) => v.password === v.confirmPassword, {
    error: "Those passwords don't match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

/** Same helper as the other validation files. Kept local, as they all do. */
export function issuesToFieldErrors(issues: z.ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.filter((p) => typeof p === "string").join(".") || "form";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

/** Any origin will do — it exists only to be compared against. */
const NOWHERE = "http://x.invalid";

/**
 * Where to go after signing in. Only ever our own paths: a `next` pointing at
 * another site would turn the login screen into an open redirect.
 *
 * Resolve it against a throwaway origin and check the origin did not move.
 * String checks are not enough here — a browser rewrites the backslash in
 * `/\evil.test` to a slash, making it `//evil.test`, which is protocol-relative
 * and lands on someone else's site. The URL parser applies those same rules, so
 * it catches the cases a `startsWith("//")` test walks straight past (tabs and
 * newlines are stripped mid-string too).
 */
export function safeNext(next: string | null | undefined): string {
  if (!next) return "/dashboard";
  try {
    const url = new URL(next, NOWHERE);
    if (url.origin !== NOWHERE) return "/dashboard";
    return url.pathname + url.search;
  } catch {
    return "/dashboard";
  }
}

/**
 * Better Auth's error codes, in plain words.
 * Sign-in never says whether it was the email or the password that was wrong —
 * that difference would let someone check which addresses have accounts.
 */
export function authErrorMessage(code: string | undefined, mode: "login" | "signup"): string {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match. Try again.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with that email already exists. Sign in instead.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 8 characters.";
    case "PASSWORD_TOO_LONG":
      return "That password is too long.";
    default:
      return mode === "login"
        ? "Couldn't sign you in. Please try again."
        : "Couldn't create your account. Please try again.";
  }
}
