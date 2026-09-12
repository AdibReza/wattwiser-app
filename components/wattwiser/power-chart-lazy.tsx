"use client";

import { Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWatts } from "@/lib/format";
import type { Point } from "./use-live-power";

type Props = {
  points: Point[];
  current: number | null | undefined;
  title?: string;
  className?: string;
  height?: number;
};

const LazyPowerChart = lazy(() => import("./power-chart").then((m) => ({ default: m.PowerChart })));

/**
 * The chart's own card, minus the chart. Same height, same header, so swapping
 * the real chart in shifts nothing.
 */
function ChartFallback({ current, title = "Power, last 60 seconds", className, height = 220 }: Props) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <span className="tabular text-2xl font-semibold text-power" aria-live="polite">
          {formatWatts(current)}
        </span>
      </CardHeader>
      <CardContent>
        <div
          className="flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
          role="status"
        >
          Collecting the first readings…
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Recharts is the heaviest thing in the client bundle and the only chart in the
 * app. Fetch it after the page is interactive instead of in the first load, so
 * arriving on /dashboard isn't a burst of parsing and hydration. The fallback is
 * the same card at the same height, and the live number reads correctly in it,
 * so nothing moves and nothing is missing while it loads.
 */
export function PowerChart(props: Props) {
  return (
    <Suspense fallback={<ChartFallback {...props} />}>
      <LazyPowerChart {...props} />
    </Suspense>
  );
}
