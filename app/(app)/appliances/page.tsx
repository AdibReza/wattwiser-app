import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/wattwiser/empty-state";
import { ApplianceList } from "@/components/wattwiser/appliance-list";
import { listAppliances } from "@/lib/db/queries/appliances";
import { requireHousehold } from "@/lib/session";

export const metadata: Metadata = { title: "Appliances" };
export const dynamic = "force-dynamic";

/** docs/specs/screens.md §3 — the inventory. */
export default async function AppliancesPage() {
  const appliances = await listAppliances(await requireHousehold());
  const calibrated = appliances.filter((a) => a.isCalibrated).length;

  return (
    <>
      <PageHeader
        title="Appliances"
        description={
          appliances.length
            ? `${appliances.length} ${appliances.length === 1 ? "appliance" : "appliances"} · ${calibrated} calibrated`
            : "Everything in your home that uses electricity and that you want WattWiser to recognise."
        }
        action={
          <Button asChild>
            <Link href="/appliances/new">
              <Plus data-icon="inline-start" />
              Add appliance
            </Link>
          </Button>
        }
      />
      {appliances.length ? (
        <ApplianceList appliances={appliances} />
      ) : (
        <EmptyState
          title="No appliances yet"
          description="Start with the big ones: kettle, washing machine, air conditioner, hot water."
          action={
            <Button asChild variant="outline">
              <Link href="/appliances/new">Add your first appliance</Link>
            </Button>
          }
        />
      )}
    </>
  );
}
