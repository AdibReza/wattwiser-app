import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalibrationWizard } from "@/components/wattwiser/wizard/calibration-wizard";
import { getAppliance } from "@/lib/db/queries/appliances";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ applianceId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { applianceId } = await params;
  const appliance = await getAppliance(applianceId);
  return { title: appliance ? `Calibrate ${appliance.name}` : "Calibration" };
}

/** docs/specs/screens.md §5 — the core of the MVP. */
export default async function CalibrationPage({ params }: Props) {
  const { applianceId } = await params;
  const appliance = await getAppliance(applianceId);
  if (!appliance) notFound();
  return (
    <div className="py-4">
      <p className="mx-auto mb-4 max-w-xl text-sm text-muted-foreground">
        Calibrating <span className="font-medium text-foreground">{appliance.name}</span>
      </p>
      <CalibrationWizard appliance={appliance} />
    </div>
  );
}
