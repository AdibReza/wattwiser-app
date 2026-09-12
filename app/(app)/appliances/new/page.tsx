import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ApplianceForm } from "@/components/wattwiser/appliance-form";

export const metadata: Metadata = { title: "Add appliance" };

/** docs/specs/screens.md §4 */
export default function NewAppliancePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add appliance" description="The type matters most: it decides how calibration will guide you." />
      <ApplianceForm mode="create" />
    </div>
  );
}
