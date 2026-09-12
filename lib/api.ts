import { NextResponse } from "next/server";
import type { z } from "zod";

/** Shared helpers for route handlers — docs/architecture.md §3 "Data and time". */
export function errorMessage(err: unknown, fallback = "Something went wrong.") {
  return err instanceof Error ? err.message : fallback;
}

export function badRequest(error: string, fields?: Record<string, string>) {
  return NextResponse.json(fields ? { error, fields } : { error }, { status: 400 });
}

export function notFound(what: string) {
  return NextResponse.json({ error: `${what} not found.` }, { status: 404 });
}

export function serverError(err: unknown) {
  return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
}

/** Parse + validate a JSON body. Returns the data or a ready-made 400 response. */
export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
  toFieldErrors: (issues: z.ZodIssue[]) => Record<string, string>
): Promise<{ data: z.infer<T>; response?: undefined } | { data?: undefined; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: badRequest("The request body must be JSON.") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { response: badRequest("Some fields need attention.", toFieldErrors(parsed.error.issues)) };
  }
  return { data: parsed.data };
}
