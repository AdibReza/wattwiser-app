"use client";

import { memo, useDeferredValue, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatTime, formatWatts } from "@/lib/format";
import type { Point } from "./use-live-power";

const config = { watts: { label: "Power", color: "var(--chart-1)" } } satisfies ChartConfig;

/* Stable prop identities, so the axes don't reconcile on every one-second tick. */
const formatTimeTick = (v: number) => formatTime(new Date(v));
const formatWattsTick = (v: number) => formatWatts(v);
const yDomain: [number, (max: number) => number] = [0, (max: number) => Math.max(500, Math.ceil(max / 500) * 500)];
const chartMargin = { left: 0, right: 8, top: 8, bottom: 0 };

/**
 * Whole-house power over the last 60 seconds. The current value is always
 * shown as text beside the title, so nobody has to read it off the line.
 *
 * New readings arrive once a second. `useDeferredValue` re-renders the SVG at
 * transition priority, so redrawing the line yields to scrolling and clicks
 * instead of blocking them; the headline number beside the title is NOT
 * deferred, so it stays exactly in step with the tile.
 */
function PowerChartImpl({
  points,
  current,
  title = "Power, last 60 seconds",
  className,
  height = 220,
}: {
  points: Point[];
  current: number | null | undefined;
  title?: string;
  className?: string;
  height?: number;
}) {
  const deferredPoints = useDeferredValue(points);

  const data = useMemo(
    () => deferredPoints.map((p) => ({ t: new Date(p.ts).getTime(), watts: p.watts })),
    [deferredPoints]
  );
  // The window ends at the newest reading, not the wall clock, so rendering stays pure.
  const domain = useMemo<[number, number]>(() => {
    const latest = data.length ? data[data.length - 1].t : 0;
    return [latest - 60_000, latest];
  }, [data]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <span className="tabular text-2xl font-semibold text-power" aria-live="polite">
          {formatWatts(current)}
        </span>
      </CardHeader>
      <CardContent>
        {data.length < 2 ? (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height }}
            role="status"
          >
            Collecting the first readings…
          </div>
        ) : (
          <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
            <AreaChart data={data} margin={chartMargin}>
              <defs>
                <linearGradient id="powerFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-watts)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-watts)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                type="number"
                domain={domain}
                tickFormatter={formatTimeTick}
                tickLine={false}
                axisLine={false}
                minTickGap={48}
              />
              <YAxis
                tickFormatter={formatWattsTick}
                tickLine={false}
                axisLine={false}
                width={64}
                domain={yDomain}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => formatTime(new Date(payload?.[0]?.payload?.t))}
                    formatter={(value) => formatWatts(Number(value))}
                  />
                }
              />
              <Area
                dataKey="watts"
                type="monotone"
                stroke="var(--color-watts)"
                fill="url(#powerFill)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export const PowerChart = memo(PowerChartImpl);
