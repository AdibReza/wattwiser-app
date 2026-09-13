import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/session";

// Every customer screen lives under this route group and gets the sidebar shell.
// This is also the real authentication boundary: proxy.ts only sniffs a cookie,
// whereas this validates the session against the database before anything renders.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // `stale` tells proxy.ts the cookie is dead, so it lets /login render and
  // clears the cookie instead of bouncing back here — otherwise the two
  // redirects chase each other forever.
  if (!session) redirect("/login?stale=1");
  return <AppShell userEmail={session.user.email}>{children}</AppShell>;
}
