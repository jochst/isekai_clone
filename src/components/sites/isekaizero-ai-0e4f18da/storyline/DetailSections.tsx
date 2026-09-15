"use client";

import { useState, type ReactNode } from "react";
import { ChevronUp, FlaskConical, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Storyline } from "@/types/isekaizero";
import { StoryCard } from "../shared/StoryCard";
import { formatCountLower } from "../shared/format";

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mt-[20px] flex h-[26px] w-full flex-row items-center justify-between text-left"
      >
        <h2 className="iz-gradient-text bg-[linear-gradient(to_right,rgb(255,255,255),rgb(255,152,152))] font-[family-name:var(--font-roboto)] text-[16px] font-semibold leading-[19px]">
          {title}
        </h2>
        <ChevronUp
          size={22}
          className={cn("shrink-0 text-[rgb(240,245,255)] transition-transform duration-200", !open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open ? children : null}
    </section>
  );
}

export interface DetailSectionsProps {
  storyline: Storyline;
  related: Storyline[];
  className?: string;
}

type DetailTab = "plot" | "scenarios";

/** "Detailed Information" / "Token Info" / "Related Content" accordions. */
export function DetailSections({ storyline, related, className }: DetailSectionsProps) {
  const [tab, setTab] = useState<DetailTab>("plot");
  const { plot, scenarios, flags, tokens } = storyline;
  const relatedItems = related.filter((s) => s.id !== storyline.id).slice(0, 3);

  return (
    <div className={cn("text-white", className)}>
      <Section title="Detailed Information">
        <div className="mt-[12px] flex flex-row gap-[24px] border-b border-[rgba(255,255,255,0.08)]">
          <TabButton active={tab === "plot"} onClick={() => setTab("plot")}>
            Plot
          </TabButton>
          <TabButton active={tab === "scenarios"} onClick={() => setTab("scenarios")}>
            Scenarios
          </TabButton>
        </div>

        <div className="mt-[14px] whitespace-pre-wrap rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.25)] p-[16px] text-[14px] leading-[22px] text-[rgba(255,255,255,0.85)]">
          {tab === "plot"
            ? plot
            : scenarios.map((scenario, i) => (
                <div key={scenario.title} className={cn(i > 0 && "mt-[14px]")}>
                  <div className="mb-[4px] font-bold">{scenario.title}</div>
                  <div>{scenario.summary}</div>
                </div>
              ))}
        </div>

        {flags.dungeonMind ? (
          <>
            <FeatureRow Icon={Swords} title="Advanced Mode" sub="There's more depth than meets the eye!" />
            <FeatureRow Icon={FlaskConical} title="Secret Sauces" sub="Some secrets are meant to be discovered..." />
          </>
        ) : null}
      </Section>

      <Section title="Token Info">
        <div className="mt-[12px]">
          <TokenRow label="Storyline Tokens" value={formatCountLower(tokens.storyline)} />
          <TokenRow label="Characters Tokens" value={formatCountLower(tokens.characters)} />
          <TokenRow label="Estimated Total" value={formatCountLower(tokens.storyline + tokens.characters)} bold className="mt-[9px]" />
          <TokenRow label="Scenario #1 Tokens" value={formatCountLower(tokens.scenario)} className="mt-[13px]" />
        </div>
      </Section>

      <Section title="Related Content">
        <div className="iz-scrollbar-hide mt-[12px] flex flex-row gap-[8px] overflow-x-auto">
          {relatedItems.map((item) => (
            <StoryCard key={item.id} storyline={item} variant="row" />
          ))}
        </div>
      </Section>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative pb-[10px] pt-[6px] text-[14px] font-semibold leading-[17px]",
        active ? "text-white" : "text-[rgba(255,255,255,0.6)]",
      )}
    >
      {children}
      {active ? <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[rgb(255,168,168)]" aria-hidden="true" /> : null}
    </button>
  );
}

function FeatureRow({ Icon, title, sub }: { Icon: typeof Swords; title: string; sub: string }) {
  return (
    <div className="mt-[12px] flex flex-row items-center gap-[12px] rounded-[12px] bg-[rgba(255,255,255,0.04)] p-[12px]">
      <Icon size={22} className="shrink-0 text-[rgb(167,185,255)]" aria-hidden="true" />
      <div>
        <div className="text-[14px] font-bold leading-[17px]">{title}</div>
        <div className="text-[12px] leading-[15px] text-[rgba(255,255,255,0.6)]">{sub}</div>
      </div>
    </div>
  );
}

function TokenRow({ label, value, bold, className }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className={cn("flex h-[27px] flex-row items-center justify-between", bold && "font-bold", className)}>
      <span className="text-[14px] text-[rgb(148,148,148)]">{label}</span>
      <span className="text-[14px]">{value}</span>
    </div>
  );
}
