"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  APPLIANCE_CLASSES,
  CATEGORIES,
  applianceInputSchema,
  issuesToFieldErrors,
  type Appliance,
  type ApplianceClass,
} from "@/lib/validation/appliance";

type FormState = {
  name: string;
  category: (typeof CATEGORIES)[number] | "";
  applianceClass: ApplianceClass | "";
  ratedWatts: string;
  brandModel: string;
  commonSettings: string;
  notes: string;
};

const EMPTY: FormState = {
  name: "",
  category: "",
  applianceClass: "",
  ratedWatts: "",
  brandModel: "",
  commonSettings: "",
  notes: "",
};

function fromAppliance(a: Appliance | undefined): FormState {
  if (!a) return EMPTY;
  return {
    name: a.name,
    category: (a.category as FormState["category"]) ?? "",
    applianceClass: a.applianceClass,
    ratedWatts: a.ratedWatts == null ? "" : String(a.ratedWatts),
    brandModel: a.brandModel ?? "",
    commonSettings: a.commonSettings ?? "",
    notes: a.notes ?? "",
  };
}

function toInput(f: FormState): unknown {
  return {
    name: f.name,
    category: f.category || undefined,
    applianceClass: f.applianceClass || undefined,
    ratedWatts: f.ratedWatts.trim() === "" ? null : Number(f.ratedWatts),
    brandModel: f.brandModel,
    commonSettings: f.commonSettings,
    notes: f.notes,
  };
}

type Props = { mode: "create" } | { mode: "edit"; initial: Appliance };

export function ApplianceForm(props: Props) {
  const router = useRouter();
  const initial = props.mode === "edit" ? props.initial : undefined;
  const [form, setForm] = useState<FormState>(() => fromAppliance(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const err = (key: string) => (errors[key] ? <FieldError>{errors[key]}</FieldError> : null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const parsed = applianceInputSchema.safeParse(toInput(form));
    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch(initial ? `/api/appliances/${initial.id}` : "/api/appliances", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> };
        if (data.fields) setErrors(data.fields);
        setSaveError(data.error ?? "Couldn't save. Please try again.");
        return;
      }
      toast.success(initial ? "Appliance saved" : "Appliance added");
      router.push("/appliances");
      router.refresh();
    } catch {
      setSaveError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/appliances/${initial.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        setSaveError("Couldn't delete. Please try again.");
        return;
      }
      toast.success("Appliance deleted");
      router.push("/appliances");
      router.refresh();
    } catch {
      setSaveError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>About the appliance</FieldLegend>
            <FieldGroup>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Kettle"
                    autoFocus={!initial}
                    aria-invalid={!!errors.name}
                  />
                  {err("name")}
                </Field>
                <Field data-invalid={!!errors.category}>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <Select value={form.category} onValueChange={(v) => set("category", v as FormState["category"])}>
                    <SelectTrigger id="category" className="w-full" aria-invalid={!!errors.category}>
                      <SelectValue placeholder="Choose…" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {err("category")}
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>Appliance type</FieldLegend>
            <FieldDescription>This decides how the calibration steps will guide you.</FieldDescription>
            <FieldGroup>
              <RadioGroup
                value={form.applianceClass}
                onValueChange={(v) => set("applianceClass", v as ApplianceClass)}
                className="gap-3"
                aria-invalid={!!errors.applianceClass}
              >
                {APPLIANCE_CLASSES.map((o) => (
                  <FieldLabel key={o.value} htmlFor={`class-${o.value}`}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>{o.label}</FieldTitle>
                        <FieldDescription>{o.description}</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={o.value} id={`class-${o.value}`} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
              {err("applianceClass")}
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>Optional details</FieldLegend>
            <FieldDescription>Anything here helps narrow things down. Nothing here is required.</FieldDescription>
            <FieldGroup>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field data-invalid={!!errors.ratedWatts}>
                  <FieldLabel htmlFor="ratedWatts">Rated power</FieldLabel>
                  <div className="relative">
                    <Input
                      id="ratedWatts"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      placeholder="2200"
                      value={form.ratedWatts}
                      onChange={(e) => set("ratedWatts", e.target.value)}
                      className="pr-10"
                      aria-invalid={!!errors.ratedWatts}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                      W
                    </span>
                  </div>
                  <FieldDescription>From the label on the appliance. A rough guide only.</FieldDescription>
                  {err("ratedWatts")}
                </Field>
                <Field data-invalid={!!errors.brandModel}>
                  <FieldLabel htmlFor="brandModel">Make and model</FieldLabel>
                  <Input
                    id="brandModel"
                    value={form.brandModel}
                    onChange={(e) => set("brandModel", e.target.value)}
                    placeholder="e.g. Breville BKE825"
                  />
                  {err("brandModel")}
                </Field>
              </div>
              <Field data-invalid={!!errors.commonSettings}>
                <FieldLabel htmlFor="commonSettings">How you usually use it</FieldLabel>
                <Input
                  id="commonSettings"
                  value={form.commonSettings}
                  onChange={(e) => set("commonSettings", e.target.value)}
                  placeholder="e.g. 40°C cotton cycle, most mornings"
                />
                {err("commonSettings")}
              </Field>
              <Field data-invalid={!!errors.notes}>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
                {err("notes")}
              </Field>
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

      <div className="flex items-center justify-between gap-3">
        {initial ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy}>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {initial.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Its calibration runs are removed too. Past detections stay, but are no longer linked to it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/appliances")} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant={initial ? "secondary" : "default"} disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Add appliance"}
          </Button>
        </div>
      </div>
    </form>
  );
}
