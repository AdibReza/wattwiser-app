import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/wattwiser/status-badge";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { CalibrationSummary } from "@/lib/validation/appliance";

const STATUS = { running: "recording", completed: "complete", discarded: "discarded" } as const;

/** One row per calibration run, newest first. Empty until the wizard (build step 7) exists. */
export function CalibrationHistory({ runs }: { runs: CalibrationSummary[] }) {
  if (!runs.length) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No calibration runs yet. Each run teaches WattWiser what this appliance looks like; 3 to 5 runs is ideal.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="gap-0 py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="tabular">{formatDateTime(r.startedAt)}</TableCell>
              <TableCell className="tabular">{formatDuration(r.durationS)}</TableCell>
              <TableCell className="text-right">
                <StatusBadge status={STATUS[r.status]} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
