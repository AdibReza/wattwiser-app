"use client";

import { useEffect, useRef, useState } from "react";

export type Current = { watts: number; ts: string; deviceConnected: boolean };
export type Point = { ts: string; watts: number };

const WINDOW_S = 60;

/**
 * Polls /api/readings/current once a second while mounted and keeps the last
 * 60 seconds as a rolling window (seeded from /api/readings so the chart is
 * full on arrival). One poll per page: pass the result to every tile and chart.
 */
export function useLivePower(intervalMs = 1000) {
  const [current, setCurrent] = useState<Current | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [failed, setFailed] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function seed() {
      try {
        const res = await fetch("/api/readings", { cache: "no-store" });
        if (res.ok && active) setPoints(trim(((await res.json()) as Point[]) ?? []));
      } catch {
        /* the live polls will fill the window */
      }
      seeded.current = true;
    }

    async function tick() {
      try {
        const res = await fetch("/api/readings/current", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Current;
        if (active) {
          setCurrent(data);
          setFailed(false);
          setPoints((prev) => trim([...prev, { ts: data.ts, watts: data.watts }]));
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) timer = setTimeout(tick, intervalMs);
      }
    }

    seed().then(tick);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [intervalMs]);

  return { current, points, failed, connected: !!current?.deviceConnected && !failed };
}

function trim(points: Point[]): Point[] {
  const cutoff = Date.now() - WINDOW_S * 1000;
  return points.filter((p) => new Date(p.ts).getTime() >= cutoff).slice(-WINDOW_S - 5);
}

/** Today's energy, refreshed every 10 s. "Today" = the browser's local day, sent as UTC. */
export function useTodayEnergy(intervalMs = 10_000) {
  const [kwh, setKwh] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function tick() {
      try {
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        const url = `/api/readings/energy?from=${encodeURIComponent(midnight.toISOString())}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok && active) setKwh(((await res.json()) as { kwh: number }).kwh);
      } catch {
        /* keep the last value */
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
  return kwh;
}
