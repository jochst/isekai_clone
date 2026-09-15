"use client";

import Image from "next/image";
import Link from "next/link";
import { Brain, ChevronRight, FunctionSquare, RefreshCw, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LlmModel, LlmPrice, LlmProviderRoute, ProviderHealth } from "@/types/isekaizero";
import { CurrentRibbon } from "./AutoModelCard";

const CRYSTAL_BLUE = "/sites/isekaizero-ai-0e4f18da/shared/images/crystal-blue.png";
const CRYSTAL_PURPLE = "/sites/isekaizero-ai-0e4f18da/shared/images/crystal-purple.png";

const HEALTH_DOT: Record<ProviderHealth, string> = {
  healthy: "bg-[rgb(128,202,16)]",
  degraded: "bg-[rgb(255,165,0)]",
  down: "bg-[rgb(239,68,68)]",
  no_data: "bg-[rgba(255,255,255,0.4)]",
};

const HEALTH_PILL: Record<ProviderHealth, string> = {
  healthy: "bg-[rgba(128,202,16,0.2)] text-[rgb(128,202,16)]",
  degraded: "bg-[rgba(255,165,0,0.2)] text-[rgb(255,165,0)]",
  down: "bg-[rgba(239,68,68,0.2)] text-[rgb(239,68,68)]",
  no_data: "bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)]",
};

const HEALTH_LABEL: Record<ProviderHealth, string> = {
  healthy: "HEALTHY",
  degraded: "DEGRADED",
  down: "DOWN",
  no_data: "NO DATA",
};

interface Feature {
  key: keyof Pick<LlmModel, "promptCaching" | "reasoning" | "functionCall">;
  Icon: LucideIcon;
  label: string;
}

const FEATURES: Feature[] = [
  { key: "promptCaching", Icon: RefreshCw, label: "Supports prompt caching" },
  { key: "reasoning", Icon: Brain, label: "Supports reasoning" },
  { key: "functionCall", Icon: FunctionSquare, label: "Supports function calls" },
];

/** USD per million → Mana / Arcane (×100), up to two decimals, trailing zeros stripped. */
export function formatMana(usdPerMillion: number): string {
  return Number((usdPerMillion * 100).toFixed(2)).toString();
}

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

function formatContextRange(price: LlmPrice): string {
  const to = price.contextTo !== undefined ? price.contextTo.toLocaleString("en-US") : "∞";
  return `Context ${price.contextFrom.toLocaleString("en-US")} - ${to}`;
}

function ProviderLogo({ model }: { model: LlmModel }) {
  return (
    <div className="iz-border-model h-[54px] w-[54px] shrink-0 rounded-[50px] p-[2px]">
      <div className="flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-full bg-white">
        {model.iconUrl ? (
          // Provider logos come from arbitrary third-party hosts, so next/image remote patterns can't be used.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={model.iconUrl} alt="" width={50} height={50} className="h-[50px] w-[50px] object-cover" loading="lazy" />
        ) : (
          <span className="text-[22px] font-bold uppercase leading-none text-[rgb(40,75,207)]">
            {model.modelProvider.charAt(0) || model.name.charAt(0)}
          </span>
        )}
      </div>
    </div>
  );
}

function RouteChip({ route, primary }: { route: LlmProviderRoute; primary: boolean }) {
  return (
    <span
      className={cn(
        "flex h-[25px] flex-row items-center gap-[6px] rounded-[12px] border px-[10px] py-[4px] text-[11px] uppercase tracking-[0.5px]",
        primary
          ? "border-[rgb(167,185,255)] bg-[rgba(42,65,228,0.4)] font-semibold text-white"
          : "border-[rgba(255,255,255,0.3)] bg-[rgba(0,0,0,0.2)] font-medium text-[rgba(255,255,255,0.7)]",
      )}
    >
      <span className={cn("h-[7px] w-[7px] shrink-0 rounded-[4px]", HEALTH_DOT[route.health])} aria-hidden="true" />
      {route.apiProvider}
    </span>
  );
}

function HealthRow({ route }: { route: LlmProviderRoute }) {
  return (
    <div className="mt-[10px] flex h-[18px] flex-row items-center justify-between">
      <span className={cn("rounded-[4px] px-[6px] py-[2px] text-[10px] font-bold uppercase leading-[14px]", HEALTH_PILL[route.health])}>
        {HEALTH_LABEL[route.health]}
      </span>
      <span className="text-[11px] text-[rgba(255,255,255,0.5)]">{route.successPercent}%</span>
      {route.cachePercent !== undefined && (
        <span className="flex flex-row items-center gap-[3px] text-[11px] text-[rgba(255,255,255,0.5)]">
          <RefreshCw size={11} aria-hidden="true" />
          {route.cachePercent}%
        </span>
      )}
      <span className="text-[11px] text-[rgba(255,255,255,0.5)]">
        {formatSeconds(route.avgTtftMs)}s ({formatSeconds(route.avgLatencyMs)}s)
      </span>
      <span className="text-[11px] text-[rgba(255,255,255,0.5)]">{route.totalCalls} calls</span>
    </div>
  );
}

function CrystalPair() {
  return (
    <span className="relative mx-[6px] block h-[30px] w-[40px] shrink-0" aria-hidden="true">
      <Image src={CRYSTAL_BLUE} alt="" width={24} height={24} className="absolute left-0 top-[3px] h-[24px] w-[24px]" />
      <Image src={CRYSTAL_PURPLE} alt="" width={24} height={24} className="absolute left-[14px] top-[3px] h-[24px] w-[24px]" />
    </span>
  );
}

function PriceRow({ label, amount, sub }: { label: "INPUT" | "OUTPUT"; amount: number; sub: string }) {
  return (
    <div className="flex h-[34px] flex-row items-center gap-[4px] max-sm:h-auto max-sm:flex-col max-sm:items-start max-sm:gap-[2px]">
      <span className="flex h-[28px] w-[80px] shrink-0 items-center justify-center rounded-[20px] border-2 border-[rgba(255,255,255,0.25)] bg-[rgb(31,26,90)] px-[8px] py-[4px] text-[12px] font-semibold leading-none text-white">
        {label}
      </span>
      <div className="flex flex-row items-center max-sm:mt-[2px]">
        <CrystalPair />
        <div className="flex flex-col">
          <span className="text-[15px] font-bold leading-[18px] text-white">{formatMana(amount)} Mana / Arcane</span>
          <span className="text-[11px] leading-[14px] text-[rgba(255,255,255,0.55)]">{sub}</span>
        </div>
      </div>
    </div>
  );
}

function PriceBlock({ prices, byok }: { prices: LlmPrice[]; byok: boolean }) {
  if (prices.length === 0) {
    return (
      <div className="my-[12px] text-[12px] text-[rgba(255,255,255,0.5)]">{byok ? "Provider pricing" : "Pricing unavailable"}</div>
    );
  }
  const tiered = prices.length > 1;
  return (
    <div className="my-[12px] flex flex-col gap-[1px]">
      {prices.map((price, index) => (
        <div key={`${price.contextFrom}-${index}`} className={cn("flex flex-col gap-[1px]", tiered && index > 0 && "mt-[6px]")}>
          {tiered && <span className="mb-[2px] text-[11px] text-[rgba(255,255,255,0.6)]">{formatContextRange(price)}</span>}
          <PriceRow label="INPUT" amount={price.inputPerM} sub="per million input tokens" />
          <PriceRow label="OUTPUT" amount={price.outputPerM} sub="per million output tokens" />
        </div>
      ))}
    </div>
  );
}

function StarGlyph({ fill }: { fill: "full" | "half" | "empty" }) {
  if (fill === "empty") {
    return <Star size={15} className="text-[rgba(255,255,255,0.3)]" aria-hidden="true" />;
  }
  if (fill === "full") {
    return <Star size={15} className="text-[rgb(255,215,0)]" fill="rgb(255,215,0)" aria-hidden="true" />;
  }
  return (
    <span className="relative block h-[15px] w-[15px]" aria-hidden="true">
      <Star size={15} className="absolute left-0 top-0 text-[rgba(255,255,255,0.3)]" />
      <span className="absolute left-0 top-0 h-[15px] w-[50%] overflow-hidden">
        <Star size={15} className="text-[rgb(255,215,0)]" fill="rgb(255,215,0)" />
      </span>
    </span>
  );
}

function Rating({ rating }: { rating: LlmModel["rating"] }) {
  if (rating.count === 0) {
    return <span className="text-[12px] text-[rgba(255,255,255,0.55)]">No ratings yet</span>;
  }
  const rounded = Math.round(rating.average * 2) / 2;
  return (
    <div className="flex flex-row items-center gap-[6px]">
      <div className="flex flex-row items-center gap-[2px]" role="img" aria-label={`${rating.average} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <StarGlyph key={n} fill={rounded >= n ? "full" : rounded >= n - 0.5 ? "half" : "empty"} />
        ))}
      </div>
      <span className="text-[13px] font-semibold leading-none text-white">{rating.average.toFixed(1)}</span>
      <span className="text-[12px] leading-none text-[rgba(255,255,255,0.55)]">({rating.count})</span>
    </div>
  );
}

export interface ModelCardProps {
  model: LlmModel;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}

export function ModelCard({ model, selected, onSelect, className }: ModelCardProps) {
  const primaryRoute = model.routes[0];
  const features = FEATURES.filter((feature) => model[feature.key]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "iz-border-model cursor-pointer rounded-[12px] p-[2px] transition-[filter] duration-150 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(167,185,255)]",
        className,
      )}
    >
      <div className="iz-model-card relative flex h-full flex-col rounded-[10px] p-[16px] max-sm:p-[12px]">
        {selected && <CurrentRibbon />}

        <div className="flex flex-row items-center">
          <ProviderLogo model={model} />
          <div className="ml-[12px] min-w-0 flex-1">
            <div className="flex flex-row flex-wrap items-center gap-[8px]">
              {model.isNew && <span className="h-[8px] w-[8px] shrink-0 rounded-[4px] bg-[rgb(128,202,16)]" aria-hidden="true" />}
              <span className="text-[16px] font-bold leading-[20px] text-white">{model.name}</span>
              {model.isNew && (
                <span className="flex h-[16px] items-center rounded-[4px] bg-[rgb(239,68,68)] px-[6px] text-[9px] font-extrabold leading-none text-white">
                  NEW
                </span>
              )}
              {model.discountLabel && (
                <span className="flex h-[18px] items-center rounded-[9px] bg-[rgb(255,168,168)] px-[8px] text-[10px] font-bold leading-none text-[rgb(47,51,80)]">
                  {model.discountLabel}
                </span>
              )}
            </div>
            {model.description && (
              <p className="mt-[4px] text-[13px] leading-[18px] text-[rgba(255,255,255,0.7)]">{model.description}</p>
            )}
            {features.map(({ key, Icon, label }) => (
              <div key={key} className="mt-[6px] flex flex-row items-center gap-[4px] text-[12px] leading-[14px] text-[rgba(255,255,255,0.7)]">
                <Icon size={14} aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {model.routes.length > 0 && (
          <div className="mb-[4px] mt-[12px] flex flex-row flex-wrap gap-[6px]">
            {model.routes.map((route, index) => (
              <RouteChip key={`${route.apiProvider}-${index}`} route={route} primary={index === 0} />
            ))}
          </div>
        )}

        {primaryRoute && <HealthRow route={primaryRoute} />}

        <PriceBlock prices={model.prices} byok={Boolean(model.byok)} />

        <div className="mt-auto flex h-[19px] flex-row items-center justify-between">
          <span className="text-[14px] text-[rgba(255,255,255,0.9)]">Context limit</span>
          <span className="text-[14px] font-semibold text-white">
            {model.contextLimit > 0 ? model.contextLimit.toLocaleString("en-US") : "—"}
          </span>
        </div>

        <div className="mt-[10px] flex h-[28px] flex-row items-center justify-between border-t border-[rgba(255,255,255,0.1)] pt-[10px]">
          <Rating rating={model.rating} />
          <Link
            href="#"
            onClick={(e) => e.stopPropagation()}
            className="flex flex-row items-center text-[13px] font-medium text-[rgb(167,185,255)] hover:underline"
          >
            Reviews
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
