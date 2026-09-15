"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { LlmModel } from "@/types/isekaizero";
import { AutoModelCard } from "./AutoModelCard";
import { ModelCard } from "./ModelCard";
import { ProviderChips } from "./ProviderChips";
import { MODEL_TIERS, matchesProvider, matchesTier, useModelCatalog, type ModelTier } from "./use-model-catalog";

export interface LlmPickerPageProps {
  selectedId: string | "auto";
  onSelect: (id: string | "auto", byok: boolean) => void;
  /** Reserved for the header back link (rendered by the page's `PageHeader`, not here). */
  backHref?: string;
}

const SKELETON_KEYS = [0, 1, 2, 3];

function TierTabs({ active, onChange }: { active: ModelTier; onChange: (tier: ModelTier) => void }) {
  return (
    <div role="tablist" aria-label="Model tier" className="mb-[10px] flex h-[40px] flex-row border-b border-[rgba(255,255,255,0.08)] min-[1120px]:-mx-[20px]">
      {MODEL_TIERS.map((tier) => {
        const isActive = tier.id === active;
        return (
          <button
            key={tier.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tier.id)}
            className="flex flex-1 flex-col items-center px-[6px] pt-[10px]"
          >
            <span
              className={cn(
                "pb-[8px] text-[14px] leading-[14px] transition-colors duration-150",
                isActive ? "font-bold text-white" : "font-medium text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.8)]",
              )}
            >
              {tier.label}
            </span>
            <span
              className={cn(
                "h-[2px] w-[calc(100%-12px)] rounded-t-[2px] transition-colors duration-150",
                isActive ? "bg-[rgb(167,185,255)]" : "bg-transparent",
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

function ModelGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-x-[18px] gap-y-[16px] min-[900px]:grid-cols-2", className)}>{children}</div>;
}

function SkeletonGrid() {
  return (
    <ModelGrid className="mt-[16px]">
      {SKELETON_KEYS.map((key) => (
        <div key={key} className="iz-skeleton h-[374px] rounded-[12px]" />
      ))}
    </ModelGrid>
  );
}

function ByokCallout() {
  return (
    <div className="iz-border-model mt-[20px] rounded-[12px] p-[2px]">
      <div className="iz-model-card flex flex-col items-start gap-[12px] rounded-[10px] p-[16px] max-sm:p-[12px] sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="text-[16px] font-bold leading-[20px] text-white">Bring your own key</div>
          <p className="mt-[4px] text-[13px] leading-[18px] text-[rgba(255,255,255,0.7)]">
            Connect NanoGPT or any OpenAI-compatible API to chat with hundreds of models using your own credits.
          </p>
        </div>
        <Link href="/settings/providers" className="iz-border-button inline-flex h-[44px] shrink-0 rounded-[22px] p-[1.5px] transition-[filter] duration-150 hover:brightness-110">
          <span className="iz-btn-primary flex h-full items-center justify-center rounded-[21px] px-[24px] text-[14px] font-semibold text-white">
            Set up provider
          </span>
        </Link>
      </div>
    </div>
  );
}

function EmptyNotice({ children }: { children: React.ReactNode }) {
  return <p className="mt-[16px] text-[13px] text-[rgba(255,255,255,0.5)]">{children}</p>;
}

export function LlmPickerPage({ selectedId, onSelect }: LlmPickerPageProps) {
  const [tier, setTier] = useState<ModelTier>("all");
  const [chip, setChip] = useState<string>("all");
  const [compact, setCompact] = useState(false);

  const catalog = useModelCatalog();
  const { configured, hydrated, presetLabel, byokStatus, byokError, byokModels, catalogModels, chips, updateSettings } = catalog;

  const visibleCatalog = useMemo(() => catalogModels.filter((m) => matchesTier(m, tier) && matchesProvider(m, chip)), [catalogModels, tier, chip]);
  const visibleByok = useMemo(() => byokModels.filter((m) => matchesTier(m, tier) && matchesProvider(m, chip)), [byokModels, tier, chip]);

  const selectByok = (model: LlmModel) => {
    updateSettings({ textModel: model.model });
    onSelect(model.id, true);
  };

  const isByokSelected = (model: LlmModel) => selectedId === model.id || selectedId === model.model;

  return (
    <div className="mx-auto w-full max-w-[1080px] pb-[40px]">
      <TierTabs active={tier} onChange={setTier} />

      <ProviderChips chips={chips} active={chip} onChange={setChip} compact={compact} onToggleCompact={() => setCompact((c) => !c)} />

      <AutoModelCard selected={selectedId === "auto"} onSelect={() => onSelect("auto", false)} />

      {/* ---------- BYOK section ---------- */}
      {hydrated && !configured && <ByokCallout />}

      {configured && (
        <section aria-label="Your provider models">
          <div className="mt-[20px] flex flex-row items-center justify-between">
            <h2 className="text-[14px] font-bold leading-[18px] text-[rgb(167,185,255)]">Your provider · {presetLabel}</h2>
            <Link href="/settings/providers" className="text-[12px] text-[rgba(255,255,255,0.6)] hover:text-white">
              Manage keys ›
            </Link>
          </div>

          {byokStatus === "loading" && <SkeletonGrid />}

          {byokStatus === "error" && (
            <div role="alert" className="mt-[12px] rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-[14px] py-[12px] text-[13px] text-white">
              {byokError ?? "Could not load provider models."}
            </div>
          )}

          {byokStatus === "ready" &&
            (visibleByok.length > 0 ? (
              <ModelGrid className={cn("mt-[16px]", compact && "min-[900px]:grid-cols-1")}>
                {visibleByok.map((model) => (
                  <ModelCard key={model.id} model={model} selected={isByokSelected(model)} onSelect={() => selectByok(model)} />
                ))}
              </ModelGrid>
            ) : (
              <EmptyNotice>
                {byokModels.length === 0 ? "Your provider returned no text models." : "No provider models match the current filters."}
              </EmptyNotice>
            ))}
        </section>
      )}

      {/* ---------- Platform catalog ---------- */}
      <section aria-label="Platform models">
        <div className="mt-[20px] flex flex-row items-center justify-between">
          <h2 className="text-[14px] font-bold leading-[18px] text-[rgb(167,185,255)]">Platform models</h2>
          <span className="text-[12px] text-[rgba(255,255,255,0.6)]">{visibleCatalog.length} models</span>
        </div>
        <p className="mt-[8px] text-[12px] text-[rgba(255,255,255,0.5)]">
          Platform models are shown for reference; requests are sent to your configured provider.
        </p>

        {visibleCatalog.length > 0 ? (
          <ModelGrid className={cn("mt-[16px]", compact && "min-[900px]:grid-cols-1")}>
            {visibleCatalog.map((model) => (
              <ModelCard key={model.id} model={model} selected={selectedId === model.id} onSelect={() => onSelect(model.id, false)} />
            ))}
          </ModelGrid>
        ) : (
          <EmptyNotice>No models match the current filters.</EmptyNotice>
        )}
      </section>
    </div>
  );
}
