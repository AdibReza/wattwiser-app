/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts`. This runs before every page
 * request and does exactly one cheap thing: look for a session cookie.
 *
 * It is NOT a security boundary. A cookie's presence proves nothing — anyone can
 * forge one — and this file never opens the database to check. Its only job is
 * to keep a signed-out visitor from watching a screen render before being sent
 * away. The real check is in app/(app)/layout.tsx, which validates the session
 * against the database, and every route handler guards itself as well.
 *
 * /api is deliberately excluded: a fetch() follows a redirect and would receive
 * an HTML login page with status 200, which the caller would then try to parse
 * as JSON. Route handlers return a proper 401 instead.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_PAGES = ["/login", "/signup"];

/**
 * Set by whoever discovered the session is dead — app/(app)/layout.tsx after a
 * failed check, and the live-power poller after a 401. Without it the two halves
 * of this file deadlock: a cookie that exists but no longer resolves to a session
 * satisfies "signed in" here and "signed out" in the layout, so the browser
 * bounces between /dashboard and /login until it gives up with
 * ERR_TOO_MANY_REDIRECTS and the person cannot get back in without clearing
 * cookies by hand.
 */
const STALE = "stale";

/** Both names, with and without the production-only __Secure- prefix. */
const SESSION_COOKIES = [
  "better-auth.session_token",
  "better-auth.session_data",
  "__Secure-better-auth.session_token",
  "__Secure-better-auth.session_data",
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = !!getSessionCookie(request);
  const stale = request.nextUrl.searchParams.has(STALE);

  if (AUTH_PAGES.includes(pathname)) {
    // A dead cookie must not be treated as "signed in", or the loop above happens.
    if (signedIn && !stale) return NextResponse.redirect(new URL("/dashboard", request.url));

    const response = NextResponse.next();
    // Throw the dead cookie away so the next request starts clean. A Server
    // Component cannot do this; the proxy can.
    if (stale) for (const name of SESSION_COOKIES) response.cookies.delete(name);
    return response;
  }

  if (!signedIn) {
    const url = new URL("/login", request.url);
    // Send them back where they were heading. "/" means "wherever the default is".
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
