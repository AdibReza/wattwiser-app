"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import {
  COOLING,
  HEATING,
  HOME_TYPES,
  HOT_WATER,
  TARIFF_TYPES,
  householdInputSchema,
  issuesToFieldErrors,
  type Household,
  type HouseholdInput,
} from "@/lib/validation/household";

/** Form state keeps numbers as strings so half-typed values don't fight the inputs. */
type FormState = {
  label: string;
  occupants: string;
  homeType: HouseholdInput["homeType"];
  hotWater: HouseholdInput["hotWater"];
  heating: HouseholdInput["heating"];
  cooling: HouseholdInput["cooling"];
  hasSolar: boolean;
  hasBattery: boolean;
  hasEv: boolean;
  tariffType: HouseholdInput["tariff"]["tariffType"];
  rate: string;
  peakRate: string;
  offPeakRate: string;
  tier1Rate: string;
  tier1UpToKwh: string;
  tier2Rate: string;
};

const EMPTY: FormState = {
  label: "",
  occupants: "2",
  homeType: "house",
  hotWater: "unknown",
  heating: "none",
  cooling: "none",
  hasSolar: false,
  hasBattery: false,
  hasEv: false,
  tariffType: "flat",
  rate: "",
  peakRate: "",
  offPeakRate: "",
  tier1Rate: "",
  tier1UpToKwh: "",
  tier2Rate: "",
};

const str = (n: number | undefined) => (n == null ? "" : String(n));

function fromHousehold(h: Household | null): FormState {
  if (!h) return EMPTY;
  const t = h.tariff;
  return {
    ...EMPTY,
    label: h.label,
    occupants: String(h.occupants),
    homeType: h.homeType,
    hotWater: h.hotWater,
    heating: h.heating,
    cooling: h.cooling,
    hasSolar: h.hasSolar,
    hasBattery: h.hasBattery,
    hasEv: h.hasEv,
    tariffType: t.tariffType,
    rate: t.tariffType === "flat" ? str(t.rate) : "",
    peakRate: t.tariffType === "time_of_use" ? str(t.peakRate) : "",
    offPeakRate: t.tariffType === "time_of_use" ? str(t.offPeakRate) : "",
    tier1Rate: t.tariffType === "tiered" ? str(t.tier1Rate) : "",
    tier1UpToKwh: t.tariffType === "tiered" ? str(t.tier1UpToKwh) : "",
    tier2Rate: t.tariffType === "tiered" ? str(t.tier2Rate) : "",
  };
}

const num = (s: string) => (s.trim() === "" ? Number.NaN : Number(s));

function toInput(f: FormState): unknown {
  const tariff =
    f.tariffType === "flat"
      ? { tariffType: "flat", rate: num(f.rate) }
      : f.tariffType === "time_of_use"
        ? { tariffType: "time_of_use", peakRate: num(f.peakRate), offPeakRate: num(f.offPeakRate) }
        : {
            tariffType: "tiered",
            tier1Rate: num(f.tier1Rate),
            tier1UpToKwh: num(f.tier1UpToKwh),
            tier2Rate: num(f.tier2Rate),
          };
  return {
    label: f.label,
    occupants: num(f.occupants),
    homeType: f.homeType,
    hotWater: f.hotWater,
    heating: f.heating,
    cooling: f.cooling,
    hasSolar: f.hasSolar,
    hasBattery: f.hasBattery,
    hasEv: f.hasEv,
    tariff,
  };
}

export function HouseholdForm({ initial }: { initial: Household | null }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => fromHousehold(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const parsed = householdInputSchema.safeParse(toInput(form));
    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/household", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> };
        if (data.fields) setErrors(data.fields);
        setSaveError(data.error ?? "Couldn't save. Please try again.");
        return;
      }
      toast.success("Household saved");
      router.refresh();
    } catch {
      setSaveError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const err = (key: string) => (errors[key] ? <FieldError>{errors[key]}</FieldError> : null);
  const rateErr = (key: string) => err(`tariff.${key}`);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {/* 1. Your home */}
      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>Your home</FieldLegend>
            <FieldGroup>
              <Field data-invalid={!!errors.label}>
                <FieldLabel htmlFor="label">Home name</FieldLabel>
                <Input
                  id="label"
                  value={form.label}
                  onChange={(e) => set("label", e.target.value)}
                  placeholder="e.g. 12 Smith St"
                  aria-invalid={!!errors.label}
                />
                {err("label")}
              </Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field data-invalid={!!errors.occupants}>
                  <FieldLabel htmlFor="occupants">People living here</FieldLabel>
                  <Input
                    id="occupants"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={form.occupants}
                    onChange={(e) => set("occupants", e.target.value)}
                    aria-invalid={!!errors.occupants}
                  />
                  {err("occupants")}
                </Field>
                <Field>
                  <FieldLabel htmlFor="homeType">Home type</FieldLabel>
                  <Select value={form.homeType} onValueChange={(v) => set("homeType", v as FormState["homeType"])}>
                    <SelectTrigger id="homeType" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOME_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      {/* 2. Energy systems */}
      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>Energy systems</FieldLegend>
            <FieldDescription>How your home heats water and air. This narrows what WattWiser looks for.</FieldDescription>
            <FieldGroup>
              <div className="grid gap-6 sm:grid-cols-3">
                <SelectField
                  id="hotWater"
                  label="Hot water"
                  value={form.hotWater}
                  options={HOT_WATER}
                  onChange={(v) => set("hotWater", v as FormState["hotWater"])}
                />
                <SelectField
                  id="heating"
                  label="Heating"
                  value={form.heating}
                  options={HEATING}
                  onChange={(v) => set("heating", v as FormState["heating"])}
                />
                <SelectField
                  id="cooling"
                  label="Cooling"
                  value={form.cooling}
                  options={COOLING}
                  onChange={(v) => set("cooling", v as FormState["cooling"])}
                />
              </div>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      {/* 3. Solar, battery, EV */}
      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>Solar, battery and EV</FieldLegend>
            <FieldGroup>
              <SwitchField
                id="hasSolar"
                title="Solar panels"
                description="Rooftop solar feeding the house."
                checked={form.hasSolar}
                onChange={(v) => set("hasSolar", v)}
              />
              <SwitchField
                id="hasBattery"
                title="Home battery"
                description="A battery that stores solar or off-peak power."
                checked={form.hasBattery}
                onChange={(v) => set("hasBattery", v)}
              />
              <SwitchField
                id="hasEv"
                title="Electric vehicle"
                description="An EV that charges at home."
                checked={form.hasEv}
                onChange={(v) => set("hasEv", v)}
              />
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      {/* 4. Tariff */}
      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>Electricity tariff</FieldLegend>
            <FieldDescription>Used to turn kWh into dollars on the breakdown screen.</FieldDescription>
            <FieldGroup>
              <RadioGroup
                value={form.tariffType}
                onValueChange={(v) => set("tariffType", v as FormState["tariffType"])}
                className="gap-3"
              >
                {TARIFF_TYPES.map((o) => (
                  <FieldLabel key={o.value} htmlFor={`tariff-${o.value}`}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>{o.label}</FieldTitle>
                        <FieldDescription>{o.description}</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={o.value} id={`tariff-${o.value}`} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>

              {form.tariffType === "flat" && (
                <RateField id="rate" label="Rate" value={form.rate} onChange={(v) => set("rate", v)} error={rateErr("rate")} />
              )}
              {form.tariffType === "time_of_use" && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <RateField id="peakRate" label="Peak rate" value={form.peakRate} onChange={(v) => set("peakRate", v)} error={rateErr("peakRate")} />
                  <RateField id="offPeakRate" label="Off-peak rate" value={form.offPeakRate} onChange={(v) => set("offPeakRate", v)} error={rateErr("offPeakRate")} />
                </div>
              )}
              {form.tariffType === "tiered" && (
                <div className="grid gap-6 sm:grid-cols-3">
                  <RateField id="tier1Rate" label="Tier 1 rate" value={form.tier1Rate} onChange={(v) => set("tier1Rate", v)} error={rateErr("tier1Rate")} />
                  <Field data-invalid={!!errors["tariff.tier1UpToKwh"]}>
                    <FieldLabel htmlFor="tier1UpToKwh">Tier 1 up to</FieldLabel>
                    <div className="relative">
                      <Input
                        id="tier1UpToKwh"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={form.tier1UpToKwh}
                        onChange={(e) => set("tier1UpToKwh", e.target.value)}
                        className="pr-20"
                        aria-invalid={!!errors["tariff.tier1UpToKwh"]}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                        kWh/month
                      </span>
                    </div>
                    {rateErr("tier1UpToKwh")}
                  </Field>
                  <RateField id="tier2Rate" label="Tier 2 rate" value={form.tier2Rate} onChange={(v) => set("tier2Rate", v)} error={rateErr("tier2Rate")} />
                </div>
              )}
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      {saveError ? (
        <Alert variant="destructive">
          <AlertTitle>Not saved</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

/* ---------- small local helpers, used only by this form ---------- */

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function SwitchField({
  id,
  title,
  description,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={id}>{title}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </Field>
  );
}

function RateField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error: React.ReactNode;
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          placeholder="0.30"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-16"
          aria-invalid={!!error}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          $/kWh
        </span>
      </div>
      {error}
    </Field>
  );
}
