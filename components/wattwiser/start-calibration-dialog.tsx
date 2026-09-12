"use client";

import Link from "next/link";
import { ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/wattwiser/status-badge";
import type { ApplianceSummary } from "@/lib/validation/appliance";

/** The dashboard's primary action: choose which appliance to calibrate. */
export function StartCalibrationDialog({ appliances }: { appliances: ApplianceSummary[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Zap data-icon="inline-start" />
          Start calibration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Which appliance?</DialogTitle>
          <DialogDescription>
            {appliances.length
              ? "Pick one. Three to five runs each is ideal."
              : "Add an appliance first, then come back to calibrate it."}
          </DialogDescription>
        </DialogHeader>
        {appliances.length ? (
          <ul className="-mx-2 max-h-80 divide-y overflow-y-auto">
            {appliances.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/calibration/${a.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {a.isCalibrated ? `${a.calibrationCount} ${a.calibrationCount === 1 ? "run" : "runs"} so far` : "Never calibrated"}
                    </p>
                  </div>
                  <StatusBadge status={a.isCalibrated ? "calibrated" : "not-calibrated"} />
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link href="/appliances/new">Add an appliance</Link>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
