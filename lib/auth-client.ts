/**
 * Browser-side auth. Same origin as the app, so it needs no baseURL.
 * Screens call these instead of fetch(): signIn.email, signUp.email, signOut.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
export const { signIn, signUp, signOut, useSession } = authClient;
