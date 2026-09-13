import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { HouseholdForm } from "@/components/wattwiser/household-form";
import { getHousehold } from "@/lib/db/queries/household";
import { requireHousehold } from "@/lib/session";

export const metadata: Metadata = { title: "Household setup" };
export const dynamic = "force-dynamic";

/** docs/specs/screens.md §1 — the core input UI. One row, editable any time. */
export default async function SetupPage() {
  const household = await getHousehold(await requireHousehold());
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Household setup"
        description="Tell WattWiser what your home has, so it knows what to look for."
      />
      <HouseholdForm initial={household} />
    </div>
  );
}
