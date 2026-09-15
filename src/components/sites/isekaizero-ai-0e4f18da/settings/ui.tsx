"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";

import { cn } from "@/lib/utils";

/* ---------- Toggle ---------- */

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** 40×20 iOS-style switch: 14px track + 20px knob sliding 20px. */
export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-10 shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-[3px] h-[14px] rounded-[10px] transition-colors duration-150",
          checked ? "bg-[rgba(167,185,255,0.5)]" : "bg-[rgba(255,255,255,0.2)]",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 h-5 w-5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-transform duration-150",
          checked ? "translate-x-5 bg-[rgb(167,185,255)]" : "translate-x-0 bg-white",
        )}
      />
    </button>
  );
}

/* ---------- SettingRow (title/sub + toggle) ---------- */

export interface SettingRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function SettingRow({ title, description, checked, onChange, className }: SettingRowProps) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold leading-5 text-white">{title}</div>
        {description ? (
          <div className="mt-[2px] text-[12px] leading-4 text-[rgba(255,255,255,0.55)]">{description}</div>
        ) : null}
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

/* ---------- SegmentedControl ---------- */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

/** 34px pill: rgba(0,0,0,0.25) track, 3px padding, active segment rgb(42,65,228). */
export function SegmentedControl<T extends string>({ options, value, onChange, label, className }: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex h-[34px] w-full rounded-[17px] bg-[rgba(0,0,0,0.25)] p-[3px]", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center rounded-[14px] px-2 text-[12px] font-semibold leading-none whitespace-nowrap transition-colors duration-150",
              active ? "bg-[rgb(42,65,228)] text-white" : "text-[rgba(255,255,255,0.6)] hover:text-white",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- SettingCard (static card with the accordion chrome) ---------- */

export interface SettingCardProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/** `.iz-border-model` 2px ring → `.iz-accordion-card` gradient body. */
export function SettingCard({ title, description, children, className }: SettingCardProps) {
  return (
    <div className={cn("iz-border-model mb-3 rounded-[12px] p-[2px]", className)}>
      <div className="iz-accordion-card rounded-[10px] p-4">
        {title ? <div className="text-[16px] font-bold leading-5 text-white">{title}</div> : null}
        {description ? (
          <div className="mt-1 text-[13px] leading-[18px] text-[rgba(255,255,255,0.7)]">{description}</div>
        ) : null}
        {children ? <div className={cn(title || description ? "mt-3" : undefined)}>{children}</div> : null}
      </div>
    </div>
  );
}

/* ---------- AccordionCard ---------- */

export interface AccordionCardProps {
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function AccordionCard({ title, defaultOpen = false, open, onOpenChange, children, className }: AccordionCardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={cn("iz-border-model mb-3 rounded-[12px] p-[2px]", className)}>
      <div className="iz-accordion-card rounded-[10px] p-4">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={toggle}
          className="flex w-full cursor-pointer items-center justify-between text-left text-white"
        >
          <span className="text-[16px] font-bold leading-5">{title}</span>
          <ChevronDown
            size={18}
            strokeWidth={2}
            aria-hidden
            className={cn("shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </button>
        {isOpen ? <div>{children}</div> : null}
      </div>
    </div>
  );
}

/* ---------- InfoNote ---------- */

export interface InfoNoteProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function InfoNote({ children, icon, className }: InfoNoteProps) {
  return (
    <div className={cn("mb-3 flex items-start gap-[10px] rounded-[12px] bg-[rgba(255,255,255,0.05)] p-4", className)}>
      <span className="shrink-0 text-[rgba(255,255,255,0.6)]">
        {icon ?? <Info size={20} strokeWidth={2} aria-hidden />}
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-[19px] text-[rgba(255,255,255,0.7)]">{children}</div>
    </div>
  );
}

/* ---------- GradientButton ---------- */

export interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}

/** Site "Generate Image" button: 1.5px gradient ring → 49px blue gradient pill. */
export function GradientButton({ children, onClick, disabled, type = "button", className }: GradientButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "iz-border-button rounded-[25px] p-[1.5px] text-white disabled:opacity-50",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <span className="iz-btn-primary flex h-[49px] items-center justify-center gap-2 rounded-[23px] px-5 py-[14px] text-[16px] font-semibold leading-none">
        {children}
      </span>
    </button>
  );
}

/* ---------- OutlineButton (Clear key) ---------- */

export interface OutlineButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/** `.iz-border-button` ring → 44px rgb(45,49,92) pill. */
export function OutlineButton({ children, onClick, disabled, className }: OutlineButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "iz-border-button rounded-[23px] p-[1.5px] text-white disabled:opacity-50",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <span className="flex h-[44px] items-center justify-center gap-2 rounded-[22px] bg-[rgb(45,49,92)] px-5 text-[14px] font-medium leading-none">
        {children}
      </span>
    </button>
  );
}

/* ---------- ResetButton (small pill) ---------- */

export interface ResetButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

export function ResetButton({ children, onClick, className }: ResetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[26px] shrink-0 cursor-pointer items-center gap-1 rounded-[15px] bg-[rgba(255,255,255,0.1)] px-[10px] py-[5px] text-[12px] font-medium leading-none text-white hover:bg-[rgba(255,255,255,0.16)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------- SelectRow ---------- */

export interface SelectRowProps {
  title: string;
  description?: string;
  value: string;
  valueDescription?: string;
  onClick?: () => void;
  className?: string;
}

/** 49px row from the image generation page: title/sub on the left, value/sub + chevron on the right. */
export function SelectRow({ title, description, value, valueDescription, onClick, className }: SelectRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex h-[49px] w-full cursor-pointer items-center justify-between gap-3 text-left", className)}
    >
      <div className="min-w-0">
        <div className="truncate text-[18px] font-semibold leading-6 text-white">{title}</div>
        {description ? <div className="text-[14px] leading-[18px] text-[rgba(255,255,255,0.5)]">{description}</div> : null}
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-1">
        <div className="min-w-0 text-right">
          <div className="max-w-[220px] truncate text-[16px] leading-5 text-[rgb(160,160,160)]">{value}</div>
          {valueDescription ? (
            <div className="truncate text-[12px] leading-4 text-[rgba(255,255,255,0.4)]">{valueDescription}</div>
          ) : null}
        </div>
        <ChevronRight size={20} strokeWidth={2} aria-hidden className="shrink-0 text-white" />
      </div>
    </button>
  );
}

/* ---------- Field / TextInput ---------- */

export interface FieldProps {
  label: string;
  htmlFor?: string;
  helper?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, helper, children, className }: FieldProps) {
  return (
    <div className={cn("mb-3", className)}>
      <label htmlFor={htmlFor} className="mb-[6px] block text-[12px] font-semibold leading-4 text-[rgba(255,255,255,0.7)]">
        {label}
      </label>
      {children}
      {helper ? <div className="mt-[6px] text-[11px] leading-[15px] text-[rgba(255,255,255,0.45)]">{helper}</div> : null}
    </div>
  );
}

export const TEXT_INPUT_CLASS =
  "h-11 w-full rounded-[12px] border border-[rgba(167,185,255,0.5)] bg-[rgb(47,51,80)] px-[14px] text-[14px] text-white outline-none placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgb(167,185,255)]";

export interface TextInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password" | "url";
  placeholder?: string;
  autoComplete?: string;
  spellCheck?: boolean;
  className?: string;
}

export function TextInput({ id, value, onChange, type = "text", placeholder, autoComplete, spellCheck = false, className }: TextInputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      spellCheck={spellCheck}
      className={cn(TEXT_INPUT_CLASS, className)}
    />
  );
}
