"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/wattwiser/status-badge";
import { useLivePower } from "@/components/wattwiser/use-live-power";
import { WizardShell } from "@/components/wattwiser/wizard/wizard-shell";
import { assessStability, type Stability } from "@/lib/calibration/stability";
import { stepCopy } from "@/lib/calibration/copy";
import { formatWatts } from "@/lib/format";
import type { Appliance } from "@/lib/validation/appliance";

type Step = 1 | 2 | 3 | 4 | 5;

/**
 * Five screens, one row in calibration_sessions per run — docs/specs/screens.md §5.
 * Stage A: step 1 (the contamination guard). Steps 2–5 arrive in the next stages.
 */
export function CalibrationWizard({ appliance }: { appliance: Appliance }) {
  const router = useRouter();
  const live = useLivePower();
  const [step, setStep] = useState<Step>(1);
  const [baselineW, setBaselineW] = useState<number | null>(null);

  // Stability is derived from the readings themselves (the newest reading is "now"), never from the wall clock.
  const stability = useMemo<Stability>(() => {
    const latest = live.points[live.points.length - 1];
    if (!latest) return { state: "waiting", have: 0, need: 5 };
    return assessStability(live.points, new Date(latest.ts).getTime());
  }, [live.points]);

  const copy = stepCopy(step, appliance.applianceClass, appliance.name);
  const backToAppliance = () => router.push(`/appliances/${appliance.id}`);

  if (step === 1) {
    const stable = stability.state === "stable";
    return (
      <WizardShell
        step={1}
        title={copy.title}
        help={copy.help}
        note={copy.note}
        cancel={
          <Button variant="ghost" size="sm" onClick={backToAppliance}>
            Cancel
          </Button>
        }
        footer={
          <Button
            disabled={!stable}
            onClick={() => {
              if (stability.state === "stable") setBaselineW(stability.meanW);
              setStep(2);
            }}
          >
            {copy.button}
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
      </WizardShell>
    );
  }

  // Steps 2–5 are built in the next stages.
  return (
    <WizardShell
      step={step}
      title="Coming next"
      help={`Step ${step} arrives in the next stage. Baseline captured: ${formatWatts(baselineW)}.`}
      cancel={
        <Button variant="ghost" size="sm" onClick={backToAppliance}>
          Cancel
        </Button>
      }
      footer={
        <Button variant="outline" onClick={() => setStep(1)}>
          Back to step 1
        </Button>
      }
    >
      <StatusBadge status="recording" />
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
      return (
        <span className="text-success">
          Steady at about {formatWatts(stability.meanW)}. Good to go.
        </span>
      );
  }
}
