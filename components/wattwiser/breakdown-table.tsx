import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/wattwiser/status-badge";
import { cn } from "@/lib/utils";
import { formatCost, formatKwh, formatPercent } from "@/lib/format";
import type { BreakdownItem } from "@/lib/breakdown";

/**
 * The month's energy per appliance — docs/specs/screens.md §6.
 * Seven-ish rows each carrying four numbers, so the table is the form and the
 * share is a one-hue meter, not seven competing colours. Every percentage is
 * written out as text, so nothing is conveyed by colour alone.
 * The Unknown row is always last and always present.
 */
export function BreakdownTable({ items, hasTariff }: { items: BreakdownItem[]; hasTariff: boolean }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <table className="w-full text-sm">
        <caption className="sr-only">Estimated energy, share, cost and confidence for each appliance this month</caption>
        <thead>
          <tr className="border-b text-muted-foreground">
            <th scope="col" className="px-5 py-3 text-left font-medium">
              Appliance
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium">
              Energy
            </th>
            <th scope="col" className="hidden px-5 py-3 text-right font-medium sm:table-cell">
              Cost
            </th>
            <th scope="col" className="hidden px-5 py-3 text-right font-medium sm:table-cell">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => {
            const unknown = item.applianceId === null;
            return (
              <tr key={item.applianceId ?? "unknown"} className={cn(unknown && "bg-muted/30")}>
                <th scope="row" className="px-5 py-4 text-left font-normal">
                  <div className="flex flex-col gap-2">
                    <span className="font-medium">{item.appliance}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-full max-w-48 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div
                          className={cn("h-full rounded-full", unknown ? "bg-neutral" : "bg-primary")}
                          style={{ width: `${Math.max(item.percent, item.kwh > 0 ? 1.5 : 0)}%` }}
                        />
                      </div>
                      <span className="tabular text-muted-foreground">{formatPercent(item.percent)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {hasTariff ? `${formatCost(item.cost)} · ` : ""}
                      {item.runs} {item.runs === 1 ? "run" : "runs"}
                    </span>
                  </div>
                </th>
                <td className="tabular px-5 py-4 text-right align-top font-medium">{formatKwh(item.kwh)}</td>
                <td className="tabular hidden px-5 py-4 text-right align-top sm:table-cell">
                  {hasTariff ? formatCost(item.cost) : "—"}
                </td>
                <td className="hidden px-5 py-4 text-right align-top sm:table-cell">
                  {item.confidence ? (
                    <StatusBadge status={item.confidence} />
                  ) : (
                    <span className="text-muted-foreground">Not identified</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
