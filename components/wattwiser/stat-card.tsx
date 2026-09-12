import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * "Current Power 850 W" style tile. `tone="power"` paints the value green —
 * reserve it for the live power number.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "power";
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 py-5", className)}>
      <CardContent className="px-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "tabular mt-2 text-3xl font-semibold tracking-tight",
            tone === "power" && "text-power"
          )}
        >
          {value}
        </p>
        {hint ? <div className="mt-2 text-sm text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}
