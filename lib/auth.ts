/**
 * Better Auth server instance — email + password only, sessions in Postgres.
 *
 * Runs on the same Drizzle connection as everything else (lib/db/client.ts), so
 * the auth tables migrate through the normal pipeline:
 *   edit lib/db/schema.ts → just generate <name> → just migrate → Vercel build
 *
 * Secrets come from the environment, never from code:
 *   BETTER_AUTH_SECRET  signs and encrypts the session cookie
 *   BETTER_AUTH_URL     http://localhost:3000 locally, the live URL on Vercel
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb, schema } from "@/lib/db/client";
import { claimOrCreateHousehold } from "@/lib/db/queries/household";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
    // MVP: no mail server anywhere (local Supabase has auth and inbucket off),
    // so an unverifiable address would lock every new account out.
    requireEmailVerification: false,
    minPasswordLength: 8,
    autoSignIn: true,
  },

  session: {
    /**
     * The signed session is carried in a cookie, so the next request does not
     * have to ask the database who you are. Verified in Better Auth's source:
     * with a database configured, a valid unexpired cache cookie makes
     * getSession return before `findSession` is ever called — two round trips
     * saved (it reads `session`, then `user`, separately, because database
     * joins are off by default and this schema declares no `relations()`).
     *
     * 60 seconds, not the 300 default: /api/readings/current is polled once a
     * second per open tab, so this still removes 59 of every 60 lookups, while
     * keeping the window in which a revoked session still works much shorter.
     *
     * The cost of that window: signing out in THIS browser is immediate
     * (signOut clears both cookies), but a session revoked from another device
     * stays usable here for up to a minute. Harmless for one household per
     * account; anything genuinely sensitive added later must ask for
     * `query: { disableCookieCache: true }` explicitly.
     */
    cookieCache: { enabled: true, maxAge: 60 },
  },

  databaseHooks: {
    user: {
      create: {
        /**
         * Every account owns exactly one household, created the moment the
         * account is. The first account ever created adopts the pre-auth
         * household instead, so the existing demo data keeps an owner.
         */
        after: async (user) => {
          await claimOrCreateHousehold(user.id);
        },
      },
    },
  },

  // Lets signIn/signUp set the session cookie from a server action or route handler.
  plugins: [nextCookies()],
});
