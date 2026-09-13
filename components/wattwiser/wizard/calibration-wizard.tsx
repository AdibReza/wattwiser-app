"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { StatusBadge } from "@/components/wattwiser/status-badge";
import { useLivePower } from "@/components/wattwiser/use-live-power";
import { PowerChart } from "@/components/wattwiser/power-chart-lazy";
import { WizardShell } from "@/components/wattwiser/wizard/wizard-shell";
import { assessStability, type Stability } from "@/lib/calibration/stability";
import { doneCopy, stepCopy, type WizardStep } from "@/lib/calibration/copy";
import { formatDuration, formatWatts } from "@/lib/format";
import type { Appliance } from "@/lib/validation/appliance";
import type { CalibrationSession } from "@/lib/validation/calibration";

/** Below this much above the starting point, the appliance counts as off. */
const OFF_THRESHOLD_W = 50;

/**
 * Three screens, one row in calibration_sessions per run — docs/specs/screens.md §5.
 *   step 1  switch it off; contamination guard (no row yet)
 *           Next → POST /api/calibration/start → the row (started_at, baseline_w)
 *   step 2  switch it on; recording
 *   step 3  switch it off; Save → POST /api/calibration/:id/finish → ended_at
 *   done    run again or leave
 * Cancel on steps 2–3 → POST /api/calibration/:id/discard.
 */
export function CalibrationWizard({ appliance }: { appliance: Appliance }) {
  const router = useRouter();
  const live = useLivePower();
  const [step, setStep] = useState<WizardStep | "done">(1);
  const [session, setSession] = useState<CalibrationSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stability is derived from the readings themselves (the newest reading is "now"), never from the wall clock.
  const stability = useMemo<Stability>(() => {
    const latest = live.points[live.points.length - 1];
    if (!latest) return { state: "waiting", have: 0, need: 5 };
    return assessStability(live.points, new Date(latest.ts).getTime());
  }, [live.points]);

  const name = appliance.name;
  const goToAppliance = () => {
    router.push(`/appliances/${appliance.id}`);
    router.refresh();
  };

  // Elapsed time comes from the newest reading's timestamp, not the wall clock, so rendering stays pure.
  const latestMs = live.current ? new Date(live.current.ts).getTime() : null;
  const elapsedS =
    session && latestMs ? Math.max(0, Math.round((latestMs - new Date(session.startedAt).getTime()) / 1000)) : null;
  const extraW =
    live.current && session?.baselineW != null ? Math.max(0, live.current.watts - session.baselineW) : null;

  /** Step 1 → 2: this is the moment the row is created. Exactly one per run. */
  async function startRun() {
    if (stability.state !== "stable") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/calibration/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applianceId: appliance.id, baselineW: stability.meanW }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't start the run.");
      setSession((await res.json()) as CalibrationSession);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start the run. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  /** Cancel on steps 2–3: the row is marked discarded, then back to the appliance. */
  async function discardRun() {
    if (!session) return goToAppliance();
    setBusy(true);
    try {
      await fetch(`/api/calibration/${session.id}/discard`, { method: "POST" });
      toast("Cancelled — nothing was saved");
    } finally {
      setBusy(false);
      goToAppliance();
    }
  }

  /** Step 3 → done: ended_at is written by the server, in UTC. */
  async function finishRun() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/calibration/${session.id}/finish`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't save the run.");
      const done = (await res.json()) as { endedAt: string | null; status: CalibrationSession["status"]; durationS: number | null };
      setSession({ ...session, endedAt: done.endedAt, status: done.status, durationS: done.durationS });
      setStep("done");
      toast.success("Run saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the run. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  /** "Run again": back to step 1 with no session — the next Next creates a fresh row. */
  function resetRun() {
    setSession(null);
    setError(null);
    setStep(1);
  }

  const cancel =
    session && (step === 2 || step === 3) ? (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={busy}>
            Cancel
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop this run?</AlertDialogTitle>
            <AlertDialogDescription>This run is thrown away. Runs you already saved for {name} are kept.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={discardRun}>
              Stop and throw away
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : (
      <Button variant="outline" size="sm" onClick={goToAppliance} disabled={busy}>
        {step === "done" ? "Close" : "Cancel"}
      </Button>
    );

  const errorBox = error ? (
    <Alert variant="destructive">
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  ) : null;

  /* ---------- done ---------- */
  if (step === "done") {
    const copy = doneCopy(name);
    return (
      <WizardShell
        step={4}
        title={copy.title}
        help={copy.help}
        cancel={cancel}
        footer={
          <>
            <Button variant="outline" onClick={goToAppliance}>
              I&apos;m done
            </Button>
            <Button onClick={resetRun}>Run again</Button>
          </>
        }
      >
        <div className="flex items-center justify-between rounded-lg border bg-success-soft/60 p-4 text-sm">
          <div>
            <p className="font-medium">Run saved for {name}</p>
            <p className="tabular text-muted-foreground">Recorded for {formatDuration(session?.durationS)}</p>
          </div>
          <StatusBadge status="complete" />
        </div>
      </WizardShell>
    );
  }

  const copy = stepCopy(step, appliance.applianceClass, name);

  /* ---------- step 1: switch it off ---------- */
  if (step === 1) {
    return (
      <WizardShell
        step={1}
        title={copy.title}
        help={copy.help}
        note={copy.note}
        cancel={cancel}
        footer={
          <Button disabled={stability.state !== "stable" || live.failed || busy} onClick={startRun}>
            {busy ? "Starting…" : startButtonLabel(stability, live.failed, copy.button)}
          </Button>
        }
      >
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium text-muted-foreground">Your home is using right now</span>
            <span className="tabular text-2xl font-semibold text-power">{formatWatts(live.current?.watts)}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            This is your starting point. When you switch {name} on, whatever gets added on top is {name}.
          </p>
          <p className="mt-3 text-sm" role="status" aria-live="polite">
            <StabilityLine stability={stability} failed={live.failed} name={name} />
          </p>
        </div>
        {errorBox}
      </WizardShell>
    );
  }

  /* ---------- step 2: switch it on, recording ---------- */
  if (step === 2 && session) {
    return (
      <WizardShell
        step={2}
        title={copy.title}
        help={copy.help}
        note={copy.note}
        cancel={cancel}
        footer={
          <Button onClick={() => setStep(3)} disabled={busy}>
            {copy.button}
          </Button>
        }
      >
        <div className="flex items-center justify-between text-sm">
          <StatusBadge status="recording" />
          <span className="tabular text-muted-foreground" aria-live="polite">
            Recording for {formatDuration(elapsedS)}
          </span>
        </div>
        <PowerChart points={live.points} current={live.current?.watts} title="Your home's power" height={180} className="shadow-none" />
        <p className="tabular text-sm text-muted-foreground">
          Added since you switched it on:{" "}
          <span className="font-medium text-foreground">{extraW == null ? "—" : formatWatts(extraW)}</span> · starting
          point {formatWatts(session.baselineW)}
        </p>
      </WizardShell>
    );
  }

  /* ---------- step 3: switch it off, save ---------- */
  if (step === 3 && session) {
    const looksOff = extraW != null && extraW < OFF_THRESHOLD_W;
    return (
      <WizardShell
        step={3}
        title={copy.title}
        help={copy.help}
        note={copy.note}
        cancel={cancel}
        footer={
          <Button onClick={finishRun} disabled={busy}>
            {busy ? "Saving…" : copy.button}
          </Button>
        }
      >
        {errorBox}
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium text-muted-foreground">Still added on top of your starting point</span>
            <span className="tabular text-2xl font-semibold">{extraW == null ? "—" : formatWatts(extraW)}</span>
          </div>
          <p className="mt-2 text-sm" role="status" aria-live="polite">
            {looksOff ? (
              <span className="text-success">Looks like it&apos;s off now. Press Save.</span>
            ) : (
              <span className="text-muted-foreground">Still using power. Switch it off first.</span>
            )}
          </p>
        </div>
        <p className="tabular text-sm text-muted-foreground">Recorded for {formatDuration(elapsedS)}</p>
      </WizardShell>
    );
  }

  return null;
}

/** The disabled button says why it is waiting, so it never looks broken. */
function startButtonLabel(stability: Stability, failed: boolean, ready: string): string {
  if (failed) return "Waiting for the meter";
  switch (stability.state) {
    case "waiting":
      return `Measuring… ${Math.max(1, Math.ceil(stability.need - stability.have))}s`;
    case "unstable":
      return "Waiting for power to settle";
    case "stable":
      return ready;
  }
}

function StabilityLine({ stability, failed, name }: { stability: Stability; failed: boolean; name: string }) {
  if (failed) return <span className="text-danger">Can&apos;t reach the meter. Check the connection.</span>;
  switch (stability.state) {
    case "waiting":
      return <span className="text-muted-foreground">Measuring for a few seconds. Don&apos;t switch anything on or off.</span>;
    case "unstable":
      return (
        <span className="text-warning">
          Hold on — something else is running. Power is jumping by {formatWatts(stability.swingW)}. Wait until it settles.
        </span>
      );
    case "stable":
      return <span className="text-success">Steady. Press Next when {name} is off.</span>;
  }
}
