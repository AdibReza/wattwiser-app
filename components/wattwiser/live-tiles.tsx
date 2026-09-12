"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/wattwiser/stat-card";
import { StatusBadge } from "@/components/wattwiser/status-badge";
import { formatWatts } from "@/lib/format";

type Current = { watts: number; ts: string; deviceConnected: boolean };

/** Polls /api/readings/current once a second while mounted. Shared by the dashboard and /dev. */
export function useCurrentReading(intervalMs = 1000) {
  const [reading, setReading] = useState<Current | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function tick() {
      try {
        const res = await fetch("/api/readings/current", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Current;
        if (active) {
          setReading(data);
          setFailed(false);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) timer = setTimeout(tick, intervalMs);
      }
    }
    tick();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [intervalMs]);

  return { reading, failed };
}

/** "Current power" and "Device status" tiles, live. */
export function LiveTiles() {
  const { reading, failed } = useCurrentReading();
  const connected = !!reading?.deviceConnected && !failed;
  return (
    <>
      <StatCard
        label="Current power"
        value={formatWatts(reading?.watts)}
        tone="power"
        hint={reading ? "Updating every second" : failed ? "Can't reach the server" : "Connecting…"}
      />
      <StatCard
        label="Device status"
        value={<StatusBadge status={connected ? "connected" : "not-connected"} />}
        hint={connected ? "Simulated meter" : undefined}
      />
    </>
  );
}
