import { cn } from "@/lib/utils";

/**
 * The only way to show a status. Words and colours are fixed here so every
 * screen says "Not Calibrated" the same way (docs/design-system.md, "Status vocabulary").
 */
export type Status =
  | "calibrated"
  | "not-calibrated"
  | "connected"
  | "not-connected"
  | "recording"
  | "complete"
  | "discarded"
  | "high"
  | "medium"
  | "low"
  | "unknown";

const STATUS: Record<Status, { label: string; className: string; dot?: boolean }> = {
  calibrated: { label: "Calibrated", className: "bg-success-soft text-success" },
  "not-calibrated": { label: "Not Calibrated", className: "bg-warning-soft text-warning" },
  connected: { label: "Connected", className: "bg-success-soft text-success", dot: true },
  "not-connected": { label: "Not Connected", className: "bg-neutral-soft text-neutral", dot: true },
  recording: { label: "Recording", className: "bg-accent text-accent-foreground", dot: true },
  complete: { label: "Complete", className: "bg-success-soft text-success" },
  discarded: { label: "Discarded", className: "bg-neutral-soft text-neutral" },
  high: { label: "High", className: "bg-success-soft text-success" },
  medium: { label: "Medium", className: "bg-warning-soft text-warning" },
  low: { label: "Low", className: "bg-neutral-soft text-neutral" },
  unknown: { label: "Unknown", className: "bg-neutral-soft text-neutral" },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        s.className,
        className
      )}
    >
      {s.dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {s.label}
    </span>
  );
}
