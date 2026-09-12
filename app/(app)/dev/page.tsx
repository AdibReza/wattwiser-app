import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { LiveTiles } from "@/components/wattwiser/live-tiles";
import { MockSwitchPanel } from "@/components/wattwiser/mock-switch-panel";
import { getMockSwitches } from "@/lib/db/queries/readings";

export const metadata: Metadata = { title: "Demo controls" };
export const dynamic = "force-dynamic";

/** docs/specs/screens.md §8 — not a customer screen. Makes the numbers move during a demo. */
export default async function DevPage() {
  const switches = await getMockSwitches();
  return (
    <>
      <PageHeader
        title="Demo controls"
        description="Flip simulated appliances on and off. The live power on the dashboard follows within a second."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LiveTiles />
      </div>
      <div className="mt-6">
        <MockSwitchPanel initial={switches} />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        The house baseline drifts between 300 W and 400 W on its own, with a little noise, like a real home with a fridge and standby loads.
      </p>
    </>
  );
}
