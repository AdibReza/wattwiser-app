import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ApplianceForm } from "@/components/wattwiser/appliance-form";
import { CalibrationHistory } from "@/components/wattwiser/calibration-history";
import { getAppliance, listCalibrations } from "@/lib/db/queries/appliances";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const appliance = await getAppliance(id);
  return { title: appliance?.name ?? "Appliance" };
}

/** docs/specs/screens.md §4 — edit, plus calibration history. */
export default async function EditAppliancePage({ params }: Props) {
  const { id } = await params;
  const appliance = await getAppliance(id);
  if (!appliance) notFound();
  const runs = await listCalibrations(id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={appliance.name} description={appliance.category ?? undefined} />
      <ApplianceForm mode="edit" initial={appliance} />
      <section className="mt-10">
        <h2 className="mb-3 text-base font-medium">Calibration history</h2>
        <CalibrationHistory runs={runs} />
      </section>
    </div>
  );
}
