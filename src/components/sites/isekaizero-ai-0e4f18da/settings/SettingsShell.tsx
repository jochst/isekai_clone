"use client";

import type { ReactNode } from "react";
import { RotateCcw, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { ResetButton, Toggle } from "./ui";

export interface SettingsTab<K extends string> {
  key: K;
  label: string;
  icon: LucideIcon;
}

export interface SettingsShellProps<K extends string> {
  /** Small intro line at the top of the content column. */
  intro: string;
  onReset?: () => void;
  resetLabel?: string;
  /** Optional 56px override card between the intro and the two columns. */
  override?: {
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
  tabs: readonly SettingsTab<K>[];
  activeTab: K;
  onTabChange: (key: K) => void;
  children: ReactNode;
  className?: string;
}

/** Shared two-column settings layout (side tabs + content), 1040px centered. */
export function SettingsShell<K extends string>({
  intro,
  onReset,
  resetLabel = "Reset",
  override,
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
}: SettingsShellProps<K>) {
  return (
    <div className={cn("mx-auto w-full max-w-[1040px] pb-10", className)}>
      <div className="flex items-center gap-2 px-[15px] pt-3">
        <p className="flex-1 text-[12px] leading-[17px] text-[rgba(255,255,255,0.6)]">{intro}</p>
        {onReset ? (
          <ResetButton onClick={onReset}>
            <RotateCcw size={13} strokeWidth={2} aria-hidden />
            <span>{resetLabel}</span>
          </ResetButton>
        ) : null}
      </div>

      {override ? (
        <div className="mx-[15px] mt-3 flex min-h-[56px] items-center gap-3 rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] px-[14px] py-[10px]">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold leading-[18px] text-white">{override.title}</div>
            <div className="mt-[2px] text-[11px] leading-[15px] text-[rgba(255,255,255,0.55)]">{override.description}</div>
          </div>
          <Toggle checked={override.checked} onChange={override.onChange} label={override.title} />
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-4 md:flex-row">
        <nav
          aria-label="Settings sections"
          className="iz-scrollbar-hide flex shrink-0 flex-row gap-1 overflow-x-auto px-[15px] md:w-[230px] md:flex-col md:gap-0 md:overflow-visible md:pr-0"
        >
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "flex h-[46px] shrink-0 cursor-pointer items-center gap-[10px] rounded-[10px] border px-[14px] py-3 transition-colors duration-150 md:mb-1 md:w-full",
                  active
                    ? "border-[rgba(167,185,255,0.35)] bg-[rgba(167,185,255,0.12)]"
                    : "border-transparent hover:bg-[rgba(255,255,255,0.04)]",
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  aria-hidden
                  className={cn("shrink-0", active ? "text-[rgb(167,185,255)]" : "text-[rgba(255,255,255,0.55)]")}
                />
                <span
                  className={cn(
                    "text-[14px] leading-5 whitespace-nowrap",
                    active ? "font-bold text-white" : "font-medium text-[rgba(255,255,255,0.6)]",
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 p-[15px] md:max-w-[720px]">{children}</div>
      </div>
    </div>
  );
}
