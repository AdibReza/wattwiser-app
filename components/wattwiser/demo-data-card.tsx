"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Demo data is opt-in. A new home starts empty and stays empty until someone
 * asks for this, and they can take it away again.
 */
export function DemoDataCard({ loaded }: { loaded: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(method: "POST" | "DELETE") {
    setBusy(true);
    try {
      const res = await fetch("/api/dev/demo-data", { method });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "That didn't work. Please try again.");
        return;
      }
      toast.success(method === "POST" ? "Demo data loaded" : "Demo data removed");
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-medium">Demo data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loaded
              ? "This home has 30 days of made-up history loaded."
              : "Load a month of made-up history so every screen has something to show."}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant={loaded ? "destructive" : "outline"} className="shrink-0" disabled={busy}>
              {loaded ? <Trash2 data-icon="inline-start" /> : <Database data-icon="inline-start" />}
              {busy
                ? loaded
                  ? "Removing…"
                  : "Loading…"
                : loaded
                  ? "Remove demo data"
                  : "Load demo data"}
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{loaded ? "Remove the demo data?" : "Load 30 days of demo data?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {loaded
                  ? "This deletes the demo appliances, their calibration runs, and the meter readings from that 30-day period. Appliances you added yourself are kept, and so is your household setup."
                  : "This adds six appliances, a month of detected runs and the matching meter readings, so the dashboard and breakdown have something to show. It doesn't change your household setup, and you can remove it later."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={loaded ? buttonVariants({ variant: "destructive" }) : undefined}
                onClick={() => run(loaded ? "DELETE" : "POST")}
              >
                {loaded ? "Remove demo data" : "Load demo data"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
