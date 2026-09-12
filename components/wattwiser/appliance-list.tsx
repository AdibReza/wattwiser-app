import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/wattwiser/status-badge";
import type { ApplianceSummary } from "@/lib/validation/appliance";

/** One row per appliance: name, category, calibration status. Whole row is the link to edit. */
export function ApplianceList({ appliances }: { appliances: ApplianceSummary[] }) {
  return (
    <Card className="gap-0 py-0">
      <ul className="divide-y">
        {appliances.map((a) => (
          <li key={a.id}>
            <Link
              href={`/appliances/${a.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.name}</p>
                <p className="truncate text-sm text-muted-foreground">{a.category ?? "Uncategorised"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <StatusBadge status={a.isCalibrated ? "calibrated" : "not-calibrated"} />
                {a.isCalibrated ? (
                  <span className="tabular hidden sm:inline">
                    · {a.calibrationCount} {a.calibrationCount === 1 ? "run" : "runs"}
                  </span>
                ) : null}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
