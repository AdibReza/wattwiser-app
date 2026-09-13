import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ApplianceForm } from "@/components/wattwiser/appliance-form";
import { CalibrationHistory } from "@/components/wattwiser/calibration-history";
import { getAppliance, listCalibrations } from "@/lib/db/queries/appliances";
import { requireHousehold } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const appliance = await getAppliance(await requireHousehold(), id);
  return { title: appliance?.name ?? "Appliance" };
}

/** docs/specs/screens.md §4 — edit, plus calibration history. */
export default async function EditAppliancePage({ params }: Props) {
  const { id } = await params;
  const householdId = await requireHousehold();
  // Someone else's appliance is simply not found — same 404 as one that never existed.
  const appliance = await getAppliance(householdId, id);
  if (!appliance) notFound();
  const runs = await listCalibrations(householdId, id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={appliance.name}
        description={appliance.category ?? undefined}
        action={
          <Button asChild>
            <Link href={`/calibration/${appliance.id}`}>
              <Zap data-icon="inline-start" />
              Start calibration
            </Link>
          </Button>
        }
      />
      <ApplianceForm mode="edit" initial={appliance} />
      <section className="mt-10">
        <h2 className="mb-3 text-base font-medium">Calibration history</h2>
        <CalibrationHistory runs={runs} />
      </section>
    </div>
  );
}
