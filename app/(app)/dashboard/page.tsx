import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardLive } from "@/components/wattwiser/dashboard-live";
import { StartCalibrationDialog } from "@/components/wattwiser/start-calibration-dialog";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getHousehold } from "@/lib/db/queries/household";
import { listAppliances } from "@/lib/db/queries/appliances";

export const dynamic = "force-dynamic";

/**
 * docs/specs/screens.md §2. Live numbers come from the readings source
 * (mock generator for now) through one shared poll in DashboardLive.
 */
export default async function DashboardPage() {
  const [household, appliances] = await Promise.all([getHousehold(), listAppliances()]);
  const counts = { total: appliances.length, calibrated: appliances.filter((a) => a.isCalibrated).length };

  return (
    <>
      <PageHeader
        title={household?.label ? household.label : "Dashboard"}
        description="Live power and today's energy for your home."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/appliances/new">
                <Plus data-icon="inline-start" />
                Add appliance
              </Link>
            </Button>
            <StartCalibrationDialog appliances={appliances} />
          </div>
        }
      />

      {!household ? (
        <Alert className="mb-6">
          <Settings />
          <AlertTitle>Finish setting up your home</AlertTitle>
          <AlertDescription>
            Tell WattWiser what your home has. It takes about a minute and makes every estimate better.
          </AlertDescription>
          <AlertAction>
            <Button asChild size="sm" variant="outline">
              <Link href="/setup">Complete setup</Link>
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <DashboardLive appliances={counts} />
    </>
  );
}
