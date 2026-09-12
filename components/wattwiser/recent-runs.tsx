import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatDuration, formatKwh } from "@/lib/format";

type Run = { id: string; appliance: string; applianceId: string | null; startedAt: string; endedAt: string | null; kwh: number };

/** Usage history: when each appliance was estimated to have run (docs/specs/screens.md §6). */
export function RecentRuns({ runs }: { runs: Run[] }) {
  if (!runs.length) return null;
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base font-medium">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {runs.map((r) => {
            const seconds = r.endedAt ? (new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime()) / 1000 : null;
            return (
              <li key={r.id} className="flex items-baseline justify-between gap-4 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.appliance}</p>
                  <p className="tabular truncate text-muted-foreground">{formatDateTime(r.startedAt)}</p>
                </div>
                <p className="tabular shrink-0 text-right text-muted-foreground">
                  {formatDuration(seconds)} · <span className="font-medium text-foreground">{formatKwh(r.kwh)}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
