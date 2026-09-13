/**
 * Better Auth's own endpoints: /api/auth/sign-up/email, /sign-in/email,
 * /sign-out, /get-session and the rest. Configured in lib/auth.ts.
 * This is the one route group that is deliberately public.
 */
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
export const dynamic = "force-dynamic";
