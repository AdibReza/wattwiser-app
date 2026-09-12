"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMonth } from "@/lib/format";

/** Which month the breakdown shows. The month lives in the URL so a link can be shared. */
export function MonthPicker({ month, months }: { month: string; months: string[] }) {
  const router = useRouter();
  const options = months.includes(month) ? months : [month, ...months];
  return (
    <Select value={month} onValueChange={(m) => router.push(`/breakdown?month=${m}`)}>
      <SelectTrigger className="w-full sm:w-[190px]" aria-label="Month">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((m) => (
          <SelectItem key={m} value={m}>
            {formatMonth(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
