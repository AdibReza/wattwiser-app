"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/** Who you are signed in as, and the way out. Sits at the foot of the sidebar. */
export function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh(); // the (app) layout caches the session; force it to re-read
    } catch {
      toast.error("Couldn't sign out. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-auto border-t pt-3">
      <p className="truncate px-3 pb-2 text-sm text-muted-foreground" title={email}>
        {email}
      </p>
      <Button variant="outline" size="sm" className="w-full" onClick={onSignOut} disabled={busy}>
        <LogOut data-icon="inline-start" />
        {busy ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
