import type { Metadata } from "next";
import Link from "next/link";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/wattwiser/stat-card";
import { EmptyState } from "@/components/wattwiser/empty-state";
import { BreakdownTable } from "@/components/wattwiser/breakdown-table";
import { MonthPicker } from "@/components/wattwiser/month-picker";
import { RecentRuns } from "@/components/wattwiser/recent-runs";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { buildBreakdown } from "@/lib/breakdown";
import { eventsInRange, monthsWithEvents } from "@/lib/db/queries/breakdown";
import { getHousehold } from "@/lib/db/queries/household";
import { formatCost, formatKwh, formatMonth, formatPercent } from "@/lib/format";
import { monthRange, tariffLabel } from "@/lib/tariff";
import { requireHousehold } from "@/lib/session";

export const metadata: Metadata = { title: "Breakdown" };
export const dynamic = "force-dynamic";

/** docs/specs/screens.md §6 — where the bill went, per appliance, for one month. */
export default async function BreakdownPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: requested } = await searchParams;
  const month = requested && monthRange(requested) ? requested : new Date().toISOString().slice(0, 7);
  const range = monthRange(month)!;

  const householdId = await requireHousehold();
  const [household, evts, months] = await Promise.all([
    getHousehold(householdId),
    eventsInRange(householdId, range.from, range.to),
    monthsWithEvents(householdId),
  ]);
  const tariff = household?.tariff ?? null;
  const data = buildBreakdown(month, evts, tariff);
  const hasEvents = evts.length > 0;

  return (
    <>
      <PageHeader
        title="Breakdown"
        description={`Where your electricity went in ${formatMonth(month)}. Every figure is an estimate.`}
        action={<MonthPicker month={month} months={months} />}
      />

      {!tariff ? (
        <Alert className="mb-6">
          <Settings />
          <AlertTitle>Add your tariff to see costs</AlertTitle>
          <AlertDescription>Energy is shown either way. Costs need the rates from your household setup.</AlertDescription>
          <AlertAction>
            <Button asChild size="sm" variant="outline">
              <Link href="/setup">Complete setup</Link>
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {hasEvents ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Energy used" value={formatKwh(data.totalKwh)} hint={formatMonth(month)} />
            <StatCard
              label="Estimated cost"
              value={tariff ? formatCost(data.totalCost) : "—"}
              hint={tariffLabel(tariff)}
            />
            <StatCard
              label="Identified"
              value={formatPercent(data.identifiedPercent)}
              hint={`${formatPercent(100 - data.identifiedPercent)} could not be matched to an appliance`}
            />
          </div>

          <div className="mt-6">
            <BreakdownTable items={data.items} hasTariff={!!tariff} />
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            These are estimates worked out from the whole-house meter, not measurements of each appliance. Confidence says how
            sure WattWiser is about each match.
          </p>

          <div className="mt-8">
            <RecentRuns runs={data.recent} />
          </div>
        </>
      ) : (
        <EmptyState
          title={`Nothing detected in ${formatMonth(month)}`}
          description="Appliance runs appear here once the meter has been recording and your appliances are calibrated."
          action={
            <Button asChild variant="outline">
              <Link href="/appliances">Go to appliances</Link>
            </Button>
          }
        />
      )}
    </>
  );
}
