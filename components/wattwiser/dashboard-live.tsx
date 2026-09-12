"use client";

import { StatCard } from "@/components/wattwiser/stat-card";
import { LiveTiles, TodayEnergyTile } from "@/components/wattwiser/live-tiles";
import { PowerChart } from "@/components/wattwiser/power-chart";
import { useLivePower } from "@/components/wattwiser/use-live-power";

export function DashboardLive({ appliances }: { appliances: { total: number; calibrated: number } }) {
  const live = useLivePower();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LiveTiles live={live} />
        <TodayEnergyTile />
        <StatCard
          label="Appliances"
          value={appliances.total}
          hint={appliances.total ? `${appliances.calibrated} calibrated` : "None added yet"}
        />
      </div>
      <PowerChart className="mt-6" points={live.points} current={live.current?.watts} />
    </>
  );
}
