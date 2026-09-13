import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmQueue } from "@/components/wattwiser/confirm-queue";
import { listAppliances } from "@/lib/db/queries/appliances";
import { pendingConfirmations } from "@/lib/db/queries/events";
import { requireHousehold } from "@/lib/session";

export const metadata: Metadata = { title: "Confirm" };
export const dynamic = "force-dynamic";

/**
 * docs/specs/screens.md §7. Nothing consumes `event_confirmations` in this MVP —
 * it is labelled data the data side can use later, collected while someone is
 * already looking at the screen.
 */
export default async function ConfirmPage() {
  const householdId = await requireHousehold();
  const [queue, appliances] = await Promise.all([pendingConfirmations(householdId), listAppliances(householdId)]);
  return (
    <>
      <PageHeader
        title="Confirm"
        description="When WattWiser isn't sure which appliance it saw, your answer teaches it. It takes a few seconds."
      />
      <ConfirmQueue queue={queue} appliances={appliances} />
    </>
  );
}
