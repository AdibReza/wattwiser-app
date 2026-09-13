import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const WIZARD_STEPS = 3;

/**
 * "Step 2 of 3" + three segments. Text first, so the progress is never colour-only.
 * A step past the last one means the run is saved: every segment filled, "All done".
 */
export function WizardProgress({ step }: { step: number }) {
  const done = step > WIZARD_STEPS;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">
        {done ? "All done" : `Step ${step} of ${WIZARD_STEPS}`}
      </p>
      <ol className="flex gap-1.5" aria-hidden>
        {Array.from({ length: WIZARD_STEPS }, (_, i) => i + 1).map((n) => (
          <li
            key={n}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              done || n === step ? "bg-primary" : n < step ? "bg-primary/40" : "bg-muted"
            )}
          />
        ))}
      </ol>
    </div>
  );
}

/**
 * One instruction per screen. Progress on top, cancel top-right, the instruction
 * as the heading, whatever the step needs in the middle, one primary action at
 * the bottom right.
 */
export function WizardShell({
  step,
  title,
  help,
  note,
  cancel,
  children,
  footer,
}: {
  step: number;
  title: string;
  help?: string;
  /** A tip, not a warning — muted, so it doesn't read as something going wrong. */
  note?: string;
  cancel: React.ReactNode;
  children?: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Card className="mx-auto w-full max-w-xl gap-0 py-0">
      <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <WizardProgress step={step} />
          </div>
          {cancel}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
          {help ? <p className="text-muted-foreground">{help}</p> : null}
          {note ? <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{note}</p> : null}
        </div>
        {children}
        <div className="flex items-center justify-end gap-2 border-t pt-6">{footer}</div>
      </CardContent>
    </Card>
  );
}
