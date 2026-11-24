"use client";

import { useMemo } from "react";

import type { ProviderTextModel } from "@/app/api/providers/models/route";
import { DM_MODELS } from "@/lib/sites/isekaizero-ai-0e4f18da/dm-models";

import { useModelCatalog } from "../llms/use-model-catalog";

/** The short recommended list, used until (or if) the provider's live list loads. */
const RECOMMENDED = DM_MODELS.filter((m) => m.id !== "off");

export interface MichiruModelGroups {
  recommended: { id: string; label: string }[];
  subscription: ProviderTextModel[];
  other: ProviderTextModel[];
}

/** Splits the live list: subscription-included models first, then everything else; recommended ids stay on top. */
export function groupMichiruModels(rows: ProviderTextModel[]): MichiruModelGroups {
  const recommendedIds = new Set(RECOMMENDED.map((m) => m.id));
  const rest = rows.filter((r) => !recommendedIds.has(r.id));
  return {
    recommended: RECOMMENDED,
    subscription: rest.filter((r) => r.subscription),
    other: rest.filter((r) => !r.subscription),
  };
}

const optionClass = "bg-[#11123c]";

/** Michiru's model dropdown: any model the provider lists, with NanoGPT subscription models grouped first. */
export function MichiruModelPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { providerModels, byokStatus } = useModelCatalog();
  const groups = useMemo(() => groupMichiruModels(providerModels), [providerModels]);
  const known = new Set([...groups.recommended.map((m) => m.id), ...providerModels.map((m) => m.id)]);

  return (
    <select aria-label="Michiru's model" value={value} onChange={(e) => onChange(e.target.value)} className="max-w-full bg-transparent text-[11px] text-white/55 outline-none">
      {known.has(value) ? null : (
        <option value={value} className={optionClass}>
          {value}
        </option>
      )}
      <optgroup label="Recommended" className={optionClass}>
        {groups.recommended.map((m) => (
          <option key={m.id} value={m.id} className={optionClass}>
            {m.label}
          </option>
        ))}
      </optgroup>
      {groups.subscription.length ? (
        <optgroup label="In your NanoGPT subscription" className={optionClass}>
          {groups.subscription.map((m) => (
            <option key={m.id} value={m.id} className={optionClass}>
              {m.name}
            </option>
          ))}
        </optgroup>
      ) : null}
      {groups.other.length ? (
        <optgroup label={groups.subscription.length ? "Other models (paid)" : "All models"} className={optionClass}>
          {groups.other.map((m) => (
            <option key={m.id} value={m.id} className={optionClass}>
              {m.name}
            </option>
          ))}
        </optgroup>
      ) : null}
      {byokStatus === "loading" ? (
        <option disabled className={optionClass}>
          Loading more models…
        </option>
      ) : null}
    </select>
  );
}
