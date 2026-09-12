import Link from "next/link";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/wattwiser/stat-card";
import { StatusBadge } from "@/components/wattwiser/status-badge";
import { EmptyState } from "@/components/wattwiser/empty-state";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getHousehold } from "@/lib/db/queries/household";

export const dynamic = "force-dynamic";

/**
 * Build step 6 fills this in (docs/build-order.md). Until the mock generator
 * exists (step 5) the tiles show "—" — never a made-up fixed number.
 */
export default async function DashboardPage() {
  const household = await getHousehold();

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
        <StatCard label="Current power" value="—" tone="power" />
        <StatCard label="Today's energy" value="—" />
        <StatCard label="Device status" value={<StatusBadge status="not-connected" />} />
        <StatCard label="Appliances" value="—" />
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
