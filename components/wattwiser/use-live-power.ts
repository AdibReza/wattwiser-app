
"use client";

import { useEffect, useState } from "react";

export type Current = {
  watts: number;
  ts: string;
  deviceConnected: boolean;
};

export type Point = {
  ts: string;
  watts: number;
};

const WINDOW_MS = 60 * 60 * 1000;
const MAX_POINTS = 5000;

/** True while the browser tab is in the background. */
const hidden = () =>
  typeof document !== "undefined" &&
  document.visibilityState === "hidden";

/**
 * Loads one hour of historical readings and polls current power.
 * Chart points use measurement timestamps, not browser polling times.
 */
export function useLivePower(intervalMs = 1000) {
  const [current, setCurrent] = useState<Current | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function seed() {
      const to = new Date();
      const from = new Date(to.getTime() - WINDOW_MS);

      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });

      try {
        const res = await fetch(`/api/readings?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(
            `Historical readings request failed: ${res.status}`
          );
        }

        const data = (await res.json()) as Point[];

        if (active && Array.isArray(data)) {
          setPoints((previous) => mergePoints(previous, data));
        }
      } catch (error) {
        console.error("Could not load historical readings:", error);
      }
    }

    async function tick() {
      if (!active) return;

      if (hidden()) {
        timer = setTimeout(tick, intervalMs);
        return;
      }

      try {
        const res = await fetch("/api/readings/current", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Current reading request failed: ${res.status}`);
        }

        const data = (await res.json()) as Current;

        if (
          !Number.isFinite(data.watts) ||
          !Number.isFinite(new Date(data.ts).getTime())
        ) {
          throw new Error("The API returned an invalid power reading.");
        }

        if (active) {
          setCurrent(data);
          setFailed(false);

          setPoints((previous) =>
            mergePoints(previous, [
              { ts: data.ts, watts: data.watts },
            ])
          );
        }
      } catch (error) {
        if (active) setFailed(true);
        console.error("Could not fetch current power:", error);
      } finally {
        if (active) {
          timer = setTimeout(tick, intervalMs);
        }
      }
    }

    function onVisible() {
      if (!active || hidden()) return;

      if (timer) clearTimeout(timer);
      void tick();
    }

    void (async () => {
      await seed();
      if (active) await tick();
    })();

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;

      if (timer) clearTimeout(timer);

      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return {
    current,
    points,
    failed,
    connected: !!current?.deviceConnected && !failed,
  };
}

/**
 * Merge readings by timestamp, sort chronologically,
 * and retain only measurements from the latest hour.
 */
function mergePoints(existing: Point[], incoming: Point[]): Point[] {
  const cutoff = Date.now() - WINDOW_MS;
  const byTimestamp = new Map<number, Point>();

  for (const point of [...existing, ...incoming]) {
    const timestamp = new Date(point.ts).getTime();
    const watts = Number(point.watts);

    if (
      !Number.isFinite(timestamp) ||
      timestamp < cutoff ||
      timestamp > Date.now() + 5000 ||
      !Number.isFinite(watts) ||
      watts < 0
    ) {
      continue;
    }

    // The same measurement timestamp produces one chart point.
    byTimestamp.set(timestamp, {
      ts: new Date(timestamp).toISOString(),
      watts,
    });
  }

  return Array.from(byTimestamp.values())
    .sort(
      (a, b) =>
        new Date(a.ts).getTime() - new Date(b.ts).getTime()
    )
    .slice(-MAX_POINTS);
}

/** Today's energy, refreshed every 10 seconds. */
export function useTodayEnergy(intervalMs = 10_000) {
  const [kwh, setKwh] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      if (!active) return;

      if (hidden()) {
        timer = setTimeout(tick, intervalMs);
        return;
      }

      try {
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);

        const url = `/api/readings/energy?from=${encodeURIComponent(
          midnight.toISOString()
        )}`;

        const res = await fetch(url, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Energy request failed: ${res.status}`);
        }

        const data = (await res.json()) as { kwh: number };

        if (active && Number.isFinite(data.kwh)) {
          setKwh(data.kwh);
        }
      } catch (error) {
        console.error("Could not fetch today's energy:", error);
      } finally {
        if (active) {
          timer = setTimeout(tick, intervalMs);
        }
      }
    }

    function onVisible() {
      if (!active || hidden()) return;

      if (timer) clearTimeout(timer);
      void tick();
    }

    void tick();

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;

      if (timer) clearTimeout(timer);

      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return kwh;
}
