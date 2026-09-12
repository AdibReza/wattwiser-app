import Link from "next/link";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/wattwiser/stat-card";
import { EmptyState } from "@/components/wattwiser/empty-state";
import { LiveTiles } from "@/components/wattwiser/live-tiles";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getHousehold } from "@/lib/db/queries/household";
import { countAppliances } from "@/lib/db/queries/appliances";

export const dynamic = "force-dynamic";

/**
 * Live tiles poll the readings source (mock for now). Today's energy and the
 * 60-second chart arrive at build step 6 (docs/build-order.md).
 */
export default async function DashboardPage() {
  const [household, appliances] = await Promise.all([getHousehold(), countAppliances()]);

  return (
    <>
      <PageHeader
        title={household?.label ? household.label : "Dashboard"}
        description="Live power and today's energy for your home."
      />

      {!household ? (
        <Alert className="mb-6">
          <Settings />
          <AlertTitle>Finish setting up your home</AlertTitle>
          <AlertDescription>
            Tell WattWiser what your home has. It takes about a minute and makes every estimate better.
          </AlertDescription>
          <AlertAction>
            <Button asChild size="sm">
              <Link href="/setup">Complete setup</Link>
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LiveTiles />
        <StatCard label="Today's energy" value="—" hint="Arrives with the chart" />
        <StatCard
          label="Appliances"
          value={appliances.total}
          hint={appliances.total ? `${appliances.calibrated} calibrated` : "None added yet"}
        />
      </div>

      <div className="mt-6">
        <EmptyState
          title="Nothing to show yet"
          description="The dashboard fills in once the appliance inventory and live readings exist."
        />
      </div>
    </>
  );
}
