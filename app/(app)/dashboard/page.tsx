import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/wattwiser/stat-card";
import { StatusBadge } from "@/components/wattwiser/status-badge";
import { EmptyState } from "@/components/wattwiser/empty-state";

/**
 * Build step 6 fills this in (docs/build-order.md). Until the mock generator
 * exists (step 5) the tiles show "—" — never a made-up fixed number.
 */
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Live power and today's energy for your home." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current power" value="—" tone="power" />
        <StatCard label="Today's energy" value="—" />
        <StatCard label="Device status" value={<StatusBadge status="not-connected" />} />
        <StatCard label="Appliances" value="—" />
      </div>

      <div className="mt-6">
        <EmptyState
          title="Nothing to show yet"
          description="The dashboard fills in once the household setup and appliance inventory exist."
        />
      </div>
    </>
  );
}
