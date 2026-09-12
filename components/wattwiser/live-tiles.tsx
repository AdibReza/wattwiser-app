"use client";

import { StatCard } from "@/components/wattwiser/stat-card";
import { StatusBadge } from "@/components/wattwiser/status-badge";
import { formatKwh, formatWatts } from "@/lib/format";
import { useLivePower, useTodayEnergy } from "./use-live-power";

/** Current power + Device status, from one shared poll. Pass `live` in from the page's `useLivePower()`. */
export function LiveTiles({ live }: { live: ReturnType<typeof useLivePower> }) {
  const { current, failed, connected } = live;
  return (
    <>
      <StatCard
        label="Current power"
        value={formatWatts(current?.watts)}
        tone="power"
        hint={current ? "Updating every second" : failed ? "Can't reach the server" : "Connecting…"}
      />
      <StatCard
        label="Device status"
        value={<StatusBadge status={connected ? "connected" : "not-connected"} />}
        hint={connected ? "Simulated meter" : undefined}
      />
    </>
  );
}

export function TodayEnergyTile() {
  const kwh = useTodayEnergy();
  return <StatCard label="Today's energy" value={formatKwh(kwh)} hint="Since midnight" />;
}
