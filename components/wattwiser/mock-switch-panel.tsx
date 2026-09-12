"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatWatts } from "@/lib/format";

export type MockSwitch = { id: string; label: string; watts: number; isOn: boolean };

/** One row per simulated appliance. Flipping a switch changes the live power on the next poll. */
export function MockSwitchPanel({ initial }: { initial: MockSwitch[] }) {
  const [switches, setSwitches] = useState(initial);

  async function toggle(id: string, isOn: boolean) {
    setSwitches((all) => all.map((s) => (s.id === id ? { ...s, isOn } : s))); // optimistic
    try {
      const res = await fetch(`/api/dev/switches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOn }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setSwitches((all) => all.map((s) => (s.id === id ? { ...s, isOn: !isOn } : s)));
      toast.error("Couldn't change that switch. Try again.");
    }
  }

  const onWatts = switches.filter((s) => s.isOn).reduce((sum, s) => sum + s.watts, 0);

  return (
    <Card className="gap-0 py-0">
      <ul className="divide-y">
        {switches.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <Label htmlFor={`sw-${s.id}`} className="text-base font-medium">
                {s.label}
              </Label>
              <p className="tabular text-sm text-muted-foreground">{formatWatts(s.watts)} when on</p>
            </div>
            <Switch id={`sw-${s.id}`} checked={s.isOn} onCheckedChange={(v) => toggle(s.id, v)} />
          </li>
        ))}
      </ul>
      <p className="tabular border-t px-5 py-3 text-sm text-muted-foreground">
        Simulated appliances add {formatWatts(onWatts)} on top of the house baseline.
      </p>
    </Card>
  );
}
