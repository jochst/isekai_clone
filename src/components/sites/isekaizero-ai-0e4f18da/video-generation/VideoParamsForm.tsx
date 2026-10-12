"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import type { VideoParamSpec } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { cn } from "@/lib/utils";
import type { VideoParamValue } from "@/types/isekaizero";

import { Toggle } from "../chat/primitives";
import { OptionSheet } from "../image-generation/form-ui";

export interface VideoParamsFormProps {
  specs: VideoParamSpec[];
  values: Record<string, VideoParamValue>;
  defaults: Record<string, VideoParamValue>;
  onChange: (next: Record<string, VideoParamValue>) => void;
  className?: string;
}

const INPUT =
  "h-9 w-full rounded-[8px] border border-[rgba(167,185,255,0.4)] bg-[rgb(47,51,80)] px-3 text-[14px] text-white outline-none focus:border-[rgb(167,185,255)]";

function optionLabel(spec: VideoParamSpec, value: VideoParamValue | undefined): string {
  if (value === undefined) return "Default";
  const match = spec.options?.find((o) => o.value === String(value));
  return match?.label ?? String(value);
}

/** "5s · 720p · 16:9"-style summary of the first three select params (for compact rows). */
export function paramSummary(specs: VideoParamSpec[], values: Record<string, VideoParamValue>): string {
  return specs
    .filter((s) => s.type === "select")
    .slice(0, 3)
    .map((s) => optionLabel(s, values[s.key]))
    .filter((v) => v !== "Default")
    .join(" · ");
}

/** Schema-driven controls for a video model's parameters. Values are typed per spec; a reset link restores defaults. */
export function VideoParamsForm({ specs, values, defaults, onChange, className }: VideoParamsFormProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const set = (key: string, value: VideoParamValue) => onChange({ ...values, [key]: value });

  if (specs.length === 0) {
    return <p className={cn("text-[12px] leading-4 text-white/50", className)}>This model has no adjustable parameters.</p>;
  }

  const openSpec = specs.find((s) => s.key === openKey);

  return (
    <div className={cn("flex flex-col", className)}>
      {specs.map((spec) => {
        const value = values[spec.key];
        if (spec.type === "select") {
          return (
            <button key={spec.key} type="button" onClick={() => setOpenKey(spec.key)} className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 py-2 text-left">
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-white">{spec.label}</span>
                {spec.description ? <span className="block text-[12px] leading-4 text-white/50">{spec.description}</span> : null}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[14px] text-[rgb(160,160,160)]">
                {optionLabel(spec, value)}
                <ChevronRight size={18} aria-hidden />
              </span>
            </button>
          );
        }
        if (spec.type === "boolean") {
          return (
            <div key={spec.key} className="flex min-h-[44px] items-center justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-white">{spec.label}</span>
                {spec.description ? <span className="block text-[12px] leading-4 text-white/50">{spec.description}</span> : null}
              </span>
              <Toggle checked={value === true} onChange={(v) => set(spec.key, v)} label={spec.label} />
            </div>
          );
        }
        return (
          <label key={spec.key} className="flex flex-col gap-1 py-2">
            <span className="text-[14px] font-semibold text-white">{spec.label}</span>
            {spec.description ? <span className="text-[12px] leading-4 text-white/50">{spec.description}</span> : null}
            {spec.type === "number" ? (
              <input
                type="number"
                value={typeof value === "number" ? value : ""}
                min={spec.min}
                max={spec.max}
                step={spec.step}
                placeholder={spec.default !== undefined ? String(spec.default) : ""}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  if (Number.isFinite(n)) set(spec.key, n);
                }}
                className={INPUT}
              />
            ) : (
              <input type="text" value={typeof value === "string" ? value : ""} placeholder={spec.default !== undefined ? String(spec.default) : ""} onChange={(e) => set(spec.key, e.target.value)} className={INPUT} />
            )}
          </label>
        );
      })}

      <button type="button" onClick={() => onChange({ ...defaults })} className="mt-1 self-start text-[12px] font-semibold text-[#a7b9ff] hover:underline">
        Reset to defaults
      </button>

      {openSpec?.options ? (
        <OptionSheet
          open
          onClose={() => setOpenKey(null)}
          title={openSpec.label}
          value={String(values[openSpec.key] ?? "")}
          onPick={(key) => set(openSpec.key, key)}
          options={openSpec.options.map((o) => ({ key: o.value, label: o.label, description: o.value === o.label ? "" : o.value }))}
        />
      ) : null}
    </div>
  );
}
