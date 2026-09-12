"use client";

import { LiveTiles } from "@/components/wattwiser/live-tiles";
import { PowerChart } from "@/components/wattwiser/power-chart";
import { useLivePower } from "@/components/wattwiser/use-live-power";

export function DevLive() {
  const live = useLivePower();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <LiveTiles live={live} />
      </div>
      <PowerChart className="mt-4" points={live.points} current={live.current?.watts} height={160} />
    </>
  );
}
