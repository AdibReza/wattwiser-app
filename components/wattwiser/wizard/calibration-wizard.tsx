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
import { PowerChart } from "@/components/wattwiser/power-chart";
import { WizardShell } from "@/components/wattwiser/wizard/wizard-shell";
import { assessStability, type Stability } from "@/lib/calibration/stability";
import { stepCopy } from "@/lib/calibration/copy";
import { formatDuration, formatWatts } from "@/lib/format";
import type { Appliance } from "@/lib/validation/appliance";
import type { CalibrationSession } from "@/lib/validation/calibration";

type Step = 1 | 2 | 3 | 4 | 5;

/**
 * Five screens, one row in calibration_sessions per run — docs/specs/screens.md §5.
 *   step 1  contamination guard (no row yet)
 *   step 2  POST /api/calibration/start → the row (started_at, baseline_w)
 *   step 3  recording
 *   step 4  wait for it to finish
 *   step 5  POST /api/calibration/:id/finish → ended_at; run again or done
 * Cancel on steps 2–4 → POST /api/calibration/:id/discard.
 */
export function CalibrationWizard({ appliance }: { appliance: Appliance }) {
  const router = useRouter();
  const live = useLivePower();
  const [step, setStep] = useState<Step>(1);
  const [session, setSession] = useState<CalibrationSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stability is derived from the readings themselves (the newest reading is "now"), never from the wall clock.
  const stability = useMemo<Stability>(() => {
    const latest = live.points[live.points.length - 1];
    if (!latest) return { state: "waiting", have: 0, need: 5 };
    return assessStability(live.points, new Date(latest.ts).getTime());
  }, [live.points]);

  const copy = stepCopy(step, appliance.applianceClass, appliance.name);
  const goToAppliance = () => {
    router.push(`/appliances/${appliance.id}`);
    router.refresh();
  };

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

  /** Cancel on steps 2–4: the row is marked discarded, then back to the appliance. */
  async function discardRun() {
    if (!session) return goToAppliance();
    setBusy(true);
    try {
      await fetch(`/api/calibration/${session.id}/discard`, { method: "POST" });
      toast("Calibration cancelled");
    } finally {
      setBusy(false);
      goToAppliance();
    }
  }

  /** Step 4 → 5: ended_at is written by the server, in UTC. */
  async function finishRun() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/calibration/${session.id}/finish`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't save the run.");
      const done = (await res.json()) as { endedAt: string | null; status: CalibrationSession["status"]; durationS: number | null };
      setSession({ ...session, endedAt: done.endedAt, status: done.status, durationS: done.durationS });
      setStep(5);
      toast.success("Calibration saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the run. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  /** "Run again": back to step 1 with no session — the next I'm ready creates a fresh row. */
  function resetRun() {
    setSession(null);
    setError(null);
    setStep(1);
  }

  const cancel =
    session && step >= 2 && step <= 4 ? (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" disabled={busy}>
            Cancel
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop this calibration?</AlertDialogTitle>
            <AlertDialogDescription>This run is discarded. Nothing already saved for {appliance.name} is affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={discardRun}>
              Stop and discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : (
      <Button variant="ghost" size="sm" onClick={goToAppliance} disabled={busy}>
        Cancel
      </Button>
    );

  const errorBox = error ? (
    <Alert variant="destructive">
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  ) : null;

  /* ---------- step 1 ---------- */
  if (step === 1) {
    return (
      <WizardShell
        step={1}
        title={copy.title}
        help={copy.help}
        note={copy.note}
        cancel={cancel}
        footer={
          <Button disabled={stability.state !== "stable" || busy} onClick={startRun}>
            {busy ? "Starting…" : copy.button}
          </Button>
        }
      >
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium text-muted-foreground">Total power right now</span>
            <span className="tabular text-2xl font-semibold text-power">{formatWatts(live.current?.watts)}</span>
          </div>
          <p className="mt-2 text-sm" role="status" aria-live="polite">
            <StabilityLine stability={stability} failed={live.failed} />
          </p>
        </div>
        {errorBox}
      </WizardShell>
    );
  }

  /* ---------- step 2 ---------- */
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
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4 text-sm">
          <div>
            <p className="font-medium">Baseline captured</p>
            <p className="text-muted-foreground">
              Your home was drawing <span className="tabular font-medium text-foreground">{formatWatts(session.baselineW)}</span>{" "}
              before switching on.
            </p>
          </div>
          <StatusBadge status="recording" />
        </div>
        <p className="tabular text-sm text-muted-foreground">Live: {formatWatts(live.current?.watts)}</p>
      </WizardShell>
    );
  }

  /* ---------- step 3 ---------- */
  if (step === 3 && session) {
    // Elapsed time comes from the newest reading's timestamp, not the wall clock, so rendering stays pure.
    const latestMs = live.current ? new Date(live.current.ts).getTime() : null;
    const elapsedS = latestMs ? Math.max(0, Math.round((latestMs - new Date(session.startedAt).getTime()) / 1000)) : null;
    return (
      <WizardShell
        step={3}
        title={copy.title}
        help={copy.help}
        note={copy.note}
        cancel={cancel}
        footer={
          <Button onClick={() => setStep(4)} disabled={busy}>
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
        <PowerChart points={live.points} current={live.current?.watts} title="Power while recording" height={180} className="shadow-none" />
        <p className="tabular text-sm text-muted-foreground">
          Baseline before switching on: {formatWatts(session.baselineW)}
        </p>
      </WizardShell>
    );
  }

  /* ---------- step 4 ---------- */
  if (step === 4 && session) {
    const latestMs = live.current ? new Date(live.current.ts).getTime() : null;
    const elapsedS = latestMs ? Math.max(0, Math.round((latestMs - new Date(session.startedAt).getTime()) / 1000)) : null;
    const aboveBaseline = live.current && session.baselineW != null ? live.current.watts - session.baselineW : null;
    return (
      <WizardShell
        step={4}
        title={copy.title}
        help="Press Done only once it has switched off, so the recording ends where the appliance does."
        note={copy.note}
        cancel={cancel}
        footer={
          <Button onClick={finishRun} disabled={busy}>
            {busy ? "Saving…" : copy.button}
          </Button>
        }
      >
        {errorBox}
        <div className="flex items-center justify-between text-sm">
          <StatusBadge status="recording" />
          <span className="tabular text-muted-foreground" aria-live="polite">
            Recording for {formatDuration(elapsedS)}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium text-muted-foreground">Total power now</p>
            <p className="tabular mt-1 text-2xl font-semibold text-power">{formatWatts(live.current?.watts)}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium text-muted-foreground">Above the baseline</p>
            <p className="tabular mt-1 text-2xl font-semibold">{aboveBaseline == null ? "—" : formatWatts(Math.max(0, aboveBaseline))}</p>
            <p className="mt-1 text-xs text-muted-foreground" role="status" aria-live="polite">
              {aboveBaseline != null && aboveBaseline < 50 ? "Looks like it's off now." : "Still drawing power."}
            </p>
          </div>
        </div>
      </WizardShell>
    );
  }

  /* ---------- step 5 ---------- */
  return (
    <WizardShell
      step={5}
      title={copy.title}
      help={copy.help}
      cancel={
        <Button variant="ghost" size="sm" onClick={goToAppliance}>
          Close
        </Button>
      }
      footer={
        <>
          <Button variant="outline" onClick={goToAppliance}>
            I&apos;m done
          </Button>
          <Button onClick={resetRun}>{copy.button}</Button>
        </>
      }
    >
      <div className="flex items-center justify-between rounded-lg border bg-success-soft/60 p-4 text-sm">
        <div>
          <p className="font-medium">Run saved for {appliance.name}</p>
          <p className="tabular text-muted-foreground">
            Recorded for {formatDuration(session?.durationS)} · baseline {formatWatts(session?.baselineW)}
          </p>
        </div>
        <StatusBadge status="complete" />
      </div>
      <p className="text-sm text-muted-foreground">
        Each run teaches WattWiser a little more about what {appliance.name} looks like. You can come back and add runs any time.
      </p>
    </WizardShell>
  );
}

function StabilityLine({ stability, failed }: { stability: Stability; failed: boolean }) {
  if (failed) return <span className="text-danger">Can&apos;t reach the meter. Check the connection.</span>;
  switch (stability.state) {
    case "waiting":
      return (
        <span className="text-muted-foreground">
          Checking that nothing else is switching on… {stability.have} of {stability.need} seconds.
        </span>
      );
    case "unstable":
      return (
        <span className="text-warning">
          Hold on — something else is running. Power is moving by {formatWatts(stability.swingW)}; it needs to settle within{" "}
          {formatWatts(50)}.
        </span>
      );
    case "stable":
      return <span className="text-success">Steady at about {formatWatts(stability.meanW)}. Good to go.</span>;
  }
}
