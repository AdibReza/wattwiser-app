
"use client";

import { memo, useDeferredValue, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatTime, formatWatts } from "@/lib/format";
import type { Point } from "./use-live-power";

const config = {
  watts: {
    label: "Power",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const WINDOW_MS = 60 * 60 * 1000;
const TIME_TICK_COUNT = 7;

const formatTimeTick = (value: number) => formatTime(new Date(value));
const formatWattsTick = (value: number) => formatWatts(value);

const chartMargin = {
  left: 0,
  right: 12,
  top: 12,
  bottom: 4,
};

type ChartPoint = {
  t: number;
  watts: number;
};

function PowerChartImpl({
  points,
  current,
  title = "Power · Last 60 minutes",
  className,
  height = 280,
}: {
  points: Point[];
  current: number | null | undefined;
  title?: string;
  className?: string;
  height?: number;
}) {
  const deferredPoints = useDeferredValue(points);

  // Keep all valid readings. Do not limit the chart to the last 100 points.
  const data = useMemo<ChartPoint[]>(() => {
    const valid = deferredPoints
      .map((point) => ({
        t: new Date(point.ts).getTime(),
        watts: Number(point.watts),
      }))
      .filter(
        (point) =>
          Number.isFinite(point.t) &&
          Number.isFinite(point.watts) &&
          point.watts >= 0
      )
      .sort((a, b) => a.t - b.t);

    // Keep the newest reading for each timestamp.
    const unique = new Map<number, ChartPoint>();

    for (const point of valid) {
      unique.set(point.t, point);
    }

    return Array.from(unique.values());
  }, [deferredPoints]);

  // Keep the time axis anchored to the current time,
  // so the chart always represents the last complete hour.
  const domain = useMemo<[number, number]>(() => {
    const now = Date.now();
    return [now - WINDOW_MS, now];
  }, [data]);

  // Evenly space time labels across the full hour.
  const timeTicks = useMemo(
    () =>
      Array.from({ length: TIME_TICK_COUNT }, (_, index) => {
        return (
          domain[0] +
          ((domain[1] - domain[0]) * index) / (TIME_TICK_COUNT - 1)
        );
      }),
    [domain]
  );

  const visibleData = useMemo(
    () =>
      data.filter(
        (point) => point.t >= domain[0] && point.t <= domain[1]
      ),
    [data, domain]
  );

  // Scale the vertical axis to the readings in the visible hour.
  const yDomain = useMemo<[number, number]>(() => {
    if (visibleData.length === 0) {
      return [0, 100];
    }

    const values = visibleData.map((point) => point.watts);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    const padding = Math.max(5, range * 0.15);
    const lower = Math.max(0, min - padding);
    const upper = max + padding;

    if (upper <= lower) {
      return [0, Math.max(10, max + 5)];
    }

    return [lower, upper];
  }, [visibleData]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight">
            {title}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Live electricity consumption
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Current power</p>
          <span
            className="tabular-nums text-2xl font-semibold text-power"
            aria-live="polite"
          >
            {formatWatts(current)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {visibleData.length < 2 ? (
          <div
            className="flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground"
            style={{ height }}
            role="status"
          >
            <span>
              {visibleData.length === 0
                ? "Waiting for Shelly readings…"
                : "Collecting another reading…"}
            </span>
            <span className="text-xs">
              The timeline covers the last 60 minutes.
            </span>
          </div>
        ) : (
          <ChartContainer
            config={config}
            className="w-full"
            style={{ height }}
          >
            <AreaChart
              data={visibleData}
              margin={chartMargin}
            >
              <defs>
                <linearGradient
                  id="powerFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--color-watts)"
                    stopOpacity={0.22}
                  />
                  <stop
                    offset="75%"
                    stopColor="var(--color-watts)"
                    stopOpacity={0.06}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-watts)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 4"
                className="stroke-border"
              />

              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={domain}
                ticks={timeTicks}
                tickFormatter={formatTimeTick}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={0}
                allowDataOverflow
              />

              <YAxis
                type="number"
                tickFormatter={formatWattsTick}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={64}
                domain={yDomain}
                allowDataOverflow
                tickCount={5}
              />

              <ChartTooltip
                cursor={{
                  stroke: "var(--color-watts)",
                  strokeDasharray: "4 4",
                  strokeOpacity: 0.5,
                }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const timestamp = payload?.[0]?.payload?.t;

                      return typeof timestamp === "number"
                        ? formatTime(new Date(timestamp))
                        : "";
                    }}
                    formatter={(value) => formatWatts(Number(value))}
                  />
                }
              />

              <Area
                dataKey="watts"
                type="linear"
                stroke="var(--color-watts)"
                strokeWidth={2}
                fill="url(#powerFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </AreaChart>
          </ChartContainer>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Actual Shelly measurements · Last 60 minutes
          </p>
          <p className="text-xs text-muted-foreground">
            {visibleData.length} readings
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const PowerChart = memo(PowerChartImpl);
