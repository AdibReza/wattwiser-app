"use client";

import { useEffect, useRef, useState } from "react";

export type Current = { watts: number; ts: string; deviceConnected: boolean };
export type Point = { ts: string; watts: number };

const WINDOW_S = 60;

/** True while the tab is in the background, so the polls can idle there. */
const hidden = () => typeof document !== "undefined" && document.visibilityState === "hidden";

/**
 * A 401 means the session ended while this tab sat open. These hooks poll once a
 * second, so retrying would mean one rejected request per second forever, from
 * every abandoned tab. Stop the loop and go to the sign-in screen instead.
 *
 * Expect this to fire up to a minute LATE, and do not treat that as a bug:
 * lib/auth.ts caches the session in a signed cookie for 60 seconds, so a session
 * revoked elsewhere keeps returning 200 until that cookie lapses. Signing out in
 * this browser is immediate — it clears the cookie.
 *
 * A full page load rather than router.push: the session is gone, so every cached
 * server component in this tab is stale too.
 */
let redirecting = false;
function signedOut(): true {
  if (!redirecting && typeof window !== "undefined") {
    redirecting = true;
    const back = window.location.pathname + window.location.search;
    // `stale=1` tells proxy.ts the cookie is dead — without it the redirect below
    // bounces straight back here and the tab is stuck in a loop.
    // A hard load, not router.push, on purpose: the session is gone, so every
    // cached RSC payload and every piece of component state in this tab is stale.
    // Reloading is the only way to be sure none of it survives.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/login?stale=1&next=${encodeURIComponent(back)}`);
  }
  return true;
}

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
        if (res.status === 401) return void signedOut();
        if (res.ok && active) setPoints(trim(((await res.json()) as Point[]) ?? []));
      } catch {
        /* the live polls will fill the window */
      }
      seeded.current = true;
    }

    async function tick() {
      // A hidden tab still holds a React tree. Skip the work and the render
      // until it comes back; `onVisible` fires an immediate catch-up tick.
      if (hidden()) {
        if (active) timer = setTimeout(tick, intervalMs);
        return;
      }
      try {
        const res = await fetch("/api/readings/current", { cache: "no-store" });
        if (res.status === 401) {
          active = false;
          clearTimeout(timer);
          return void signedOut();
        }
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

    function onVisible() {
      if (!active || hidden()) return;
      clearTimeout(timer);
      tick();
    }

    seed().then(tick);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
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
      if (hidden()) {
        if (active) timer = setTimeout(tick, intervalMs);
        return;
      }
      try {
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        const url = `/api/readings/energy?from=${encodeURIComponent(midnight.toISOString())}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.status === 401) {
          active = false;
          clearTimeout(timer);
          return void signedOut();
        }
        if (res.ok && active) setKwh(((await res.json()) as { kwh: number }).kwh);
      } catch {
        /* keep the last value */
      } finally {
        if (active) timer = setTimeout(tick, intervalMs);
      }
    }
    function onVisible() {
      if (!active || hidden()) return;
      clearTimeout(timer);
      tick();
    }
    tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
  return kwh;
}
