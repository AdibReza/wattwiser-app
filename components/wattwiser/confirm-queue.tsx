"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/wattwiser/empty-state";
import { formatDateTime, formatDuration, formatKwh, formatTime, formatWatts } from "@/lib/format";
import type { ApplianceSummary } from "@/lib/validation/appliance";
import type { Answer, PendingEvent } from "@/lib/validation/confirmation";

/**
 * docs/specs/screens.md §7 — one question at a time.
 * "We detected a 1.8 kW appliance running between 7:15 PM and 8:05 PM.
 *  Was this your dishwasher?"  Yes · No · Choose another appliance · I don't know.
 * Every answer writes one event_confirmations row.
 */
export function ConfirmQueue({ queue, appliances }: { queue: PendingEvent[]; appliances: ApplianceSummary[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [answered, setAnswered] = useState(0);

  const current = queue[index];

  async function answer(value: Answer, applianceId?: string) {
    if (!current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${current.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: value, applianceId: applianceId ?? null }),
      });
      // 409 means someone already answered it — it still leaves the queue.
      if (!res.ok && res.status !== 409) {
        throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't save that answer.");
      }
      setAnswered((n) => n + 1);
      setPicking(false);
      const next = index + 1;
      setIndex(next);
      if (next >= queue.length) router.refresh();
      else toast.success("Thanks — that helps");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that answer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!current) {
    return (
      <EmptyState
        title={answered > 0 ? "All caught up" : "Nothing to check right now"}
        description={
          answered > 0
            ? `Thanks — ${answered} ${answered === 1 ? "answer" : "answers"} saved. New questions appear when WattWiser isn't sure about a run.`
            : "When WattWiser isn't sure which appliance it saw, it will ask you here."
        }
        action={
          <Button asChild variant="outline">
            <Link href="/breakdown">See the breakdown</Link>
          </Button>
        }
      />
    );
  }

  const remaining = queue.length - index;

  return (
    <div className="mx-auto w-full max-w-xl">
      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        {remaining} {remaining === 1 ? "run" : "runs"} to check
      </p>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground">
              We detected a <span className="tabular font-medium text-foreground">{formatWatts(current.watts)}</span> appliance
              running between <span className="tabular font-medium text-foreground">{formatTime(current.startedAt)}</span> and{" "}
              <span className="tabular font-medium text-foreground">{formatTime(current.endedAt)}</span>.
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-balance">
              Was this your {current.applianceName.toLowerCase()}?
            </h2>
            <p className="tabular text-sm text-muted-foreground">
              {formatDateTime(current.startedAt)} · ran for {formatDuration(current.durationS)} · used{" "}
              {formatKwh(current.energyKwh)}
            </p>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Not saved</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button size="lg" disabled={busy} onClick={() => answer("yes")}>
              Yes, that was it
            </Button>
            <Button size="lg" variant="outline" disabled={busy} onClick={() => answer("no")}>
              No, it wasn&apos;t
            </Button>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="flex-1" disabled={busy || !appliances.length} onClick={() => setPicking(true)}>
                Choose another appliance
              </Button>
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => answer("unknown")}>
                I don&apos;t know
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={picking} onOpenChange={setPicking}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Which appliance was it?</DialogTitle>
            <DialogDescription>Pick the one that was actually running at that time.</DialogDescription>
          </DialogHeader>
          <ul className="-mx-2 max-h-80 divide-y overflow-y-auto">
            {appliances
              .filter((a) => a.id !== current.applianceId)
              .map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => answer("other", a.id)}
                    className="w-full rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                  >
                    <span className="font-medium">{a.name}</span>
                    {a.category ? <span className="block text-sm text-muted-foreground">{a.category}</span> : null}
                  </button>
                </li>
              ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
