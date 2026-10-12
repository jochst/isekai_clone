"use client";

import { Check, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { BottomSheet } from "./ImageModelPicker";

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */

export interface SelectRowProps {
  title: string;
  sub: string;
  required?: boolean;
  value: string;
  valueSub?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function SelectRow({ title, sub, required, value, valueSub, onClick, className }: SelectRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex h-[49px] w-full cursor-pointer items-center justify-between text-left", className)}
    >
      <div className="mr-3 flex min-w-0 flex-1 flex-col">
        <div className="mb-1 text-[18px] font-semibold leading-[22px] text-white">
          {title}
          {required ? <span className="text-[rgb(255,87,71)]"> *</span> : null}
        </div>
        <div className="mt-[2px] text-[14px] leading-[17px] text-[rgba(255,255,255,0.5)]">{sub}</div>
      </div>
      <div className="flex max-w-[50%] items-center gap-2">
        <div className="flex min-w-0 flex-col items-end">
          <div className="max-w-full truncate whitespace-nowrap text-[16px] leading-5 text-[rgb(160,160,160)]">{value}</div>
          {valueSub ? (
            <div className="mt-[6px] flex items-center gap-1 whitespace-nowrap text-[12px] leading-[14px] text-[rgba(255,255,255,0.4)]">
              {valueSub}
            </div>
          ) : null}
        </div>
        <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-white" aria-hidden />
      </div>
    </button>
  );
}

export interface CheckboxRowProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  sub: string;
  className?: string;
}

export function CheckboxRow({ checked, onChange, title, sub, className }: CheckboxRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("flex h-11 w-full cursor-pointer items-center gap-3 text-left", className)}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors",
          checked ? "border-[rgb(167,185,255)] bg-[rgb(42,65,228)]" : "border-[rgba(167,185,255,0.5)] bg-[rgb(47,51,80)]",
        )}
      >
        {checked ? <Check size={16} strokeWidth={3} className="text-white" aria-hidden /> : null}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="mb-1 text-[16px] font-medium leading-5 text-white">{title}</span>
        <span className="text-[14px] leading-[17px] text-[rgba(255,255,255,0.5)]">{sub}</span>
      </span>
    </button>
  );
}

export interface SheetOption {
  key: string;
  label: string;
  description: string;
}

export function OptionSheet({
  open,
  onClose,
  title,
  options,
  value,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  options: SheetOption[];
  value: string;
  onPick: (key: string) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-1">
        {options.map((o) => {
          const selected = o.key === value;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onPick(o.key);
                onClose();
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-[12px] border p-3 text-left transition-colors",
                selected ? "border-[rgba(167,185,255,0.6)] bg-[rgba(42,65,228,0.25)]" : "border-transparent hover:bg-[rgba(255,255,255,0.06)]",
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-semibold leading-5 text-white">{o.label}</span>
                <span className="mt-[2px] text-[12px] leading-4 text-[rgba(255,255,255,0.6)]">{o.description}</span>
              </span>
              {selected ? <Check size={18} strokeWidth={2.5} className="shrink-0 text-white" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
