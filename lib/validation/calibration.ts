import { z } from "zod";

/** POST /api/calibration/start body */
export const startCalibrationSchema = z
  .object({
    applianceId: z.string({ error: "applianceId is required" }).uuid("applianceId must be a UUID"),
    baselineW: z.number({ error: "baselineW must be a number" }).min(0, "baselineW can't be negative").max(100_000, "baselineW is too large"),
  })
  .strict();

export type StartCalibrationInput = z.infer<typeof startCalibrationSchema>;

export type SessionStatus = "running" | "completed" | "discarded";

/** GET /api/calibration/:id — timestamps UTC ISO. */
export type CalibrationSession = {
  id: string;
  applianceId: string;
  startedAt: string;
  endedAt: string | null;
  status: SessionStatus;
  baselineW: number | null;
  durationS: number | null;
};

export function issuesToFieldErrors(issues: z.ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.filter((p) => typeof p === "string").join(".") || "form";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}
