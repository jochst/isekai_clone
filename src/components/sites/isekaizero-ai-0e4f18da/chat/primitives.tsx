"use client";

/**
 * Small chrome pieces shared by the chat screens. Visuals follow the SettingsPages spec
 * (Toggle, SegmentedControl, AccordionCard, GradientButton) so the chat drawer matches the settings pages.
 */
import { ChevronDown, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Toggle */

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative h-5 w-10 shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50")}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-[3px] h-[14px] rounded-[10px] transition-colors duration-150",
          checked ? "bg-[rgba(167,185,255,0.5)]" : "bg-white/20",
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-0 h-5 w-5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-transform duration-150",
          checked ? "translate-x-5 bg-[#a7b9ff]" : "translate-x-0 bg-white",
        )}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ SettingRow */

export interface SettingRowProps {
  title: string;
  description?: string;
  right?: ReactNode;
  className?: string;
}

export function SettingRow({ title, description, right, className }: SettingRowProps) {
  return (
    <div className={cn("flex items-center gap-3 py-[10px]", className)}>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">{title}</div>
        {description ? <div className="mt-[2px] text-[11px] leading-[15px] text-white/55">{description}</div> : null}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ SegmentedControl */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({ value, options, onChange, label, className }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex h-[34px] rounded-[17px] bg-black/25 p-[3px]", className)}>
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
              "flex-1 rounded-[14px] text-[12px] font-semibold transition-colors duration-150",
              active ? "bg-[#2a41e4] text-white" : "text-white/60 hover:text-white/85",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ AccordionCard */

export interface AccordionCardProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function AccordionCard({ title, description, defaultOpen = false, children, className }: AccordionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("iz-border-model rounded-[12px] p-[2px]", className)}>
      <div className="iz-accordion-card rounded-[10px] p-4">
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
          <span className="min-w-0">
            <span className="block text-[16px] font-bold">{title}</span>
            {description ? <span className="mt-[2px] block text-[12px] leading-4 text-white/60">{description}</span> : null}
          </span>
          <ChevronDown size={18} className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")} />
        </button>
        {open ? <div className="mt-3">{children}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ GradientButton */

export interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export function GradientButton({ children, onClick, disabled, className, type = "button" }: GradientButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("iz-border-button rounded-[25px] p-[1.5px] disabled:cursor-not-allowed disabled:opacity-50", className)}
    >
      <span className="iz-btn-primary flex h-[49px] items-center justify-center gap-2 rounded-[23px] px-5 text-[16px] font-semibold">
        {children}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ SideSheet (right drawer) */

export interface SideSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SideSheet({ open, onClose, title, subtitle, children }: SideSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="iz-scroll-thin absolute right-0 top-0 h-full w-[420px] max-w-full overflow-y-auto border-l border-white/10 bg-[#11123c] p-4 text-white animate-in slide-in-from-right duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold">{title}</h2>
            {subtitle ? <p className="mt-[2px] text-[12px] text-white/60">{subtitle}</p> : null}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ ConfirmDialog */

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Delete", onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Cancel" onClick={onCancel} className="absolute inset-0 bg-black/60 animate-in fade-in duration-200" />
      <div role="alertdialog" aria-modal="true" aria-label={title} className="relative w-full max-w-[360px] rounded-[16px] border border-white/10 bg-[#1b1c4a] p-5 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] animate-in zoom-in-95 fade-in duration-200">
        <h3 className="text-[16px] font-bold">{title}</h3>
        {description ? <p className="mt-2 text-[13px] leading-[18px] text-white/65">{description}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-9 rounded-[18px] border border-white/15 px-4 text-[13px] font-semibold hover:bg-white/10">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="h-9 rounded-[18px] border border-[rgba(255,87,71,0.5)] bg-[rgba(255,87,71,0.2)] px-4 text-[13px] font-semibold hover:bg-[rgba(255,87,71,0.3)]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Toast */

export interface ToastState {
  id: number;
  message: string;
}

export function useToast(): { toast: ToastState | null; showToast: (message: string) => void } {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const showToast = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return { toast, showToast };
}

export function ToastView({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role="status"
      className="pointer-events-none fixed bottom-[120px] left-1/2 z-[70] -translate-x-1/2 rounded-[12px] border border-white/12 bg-[#1b1c4a] px-4 py-[10px] text-[13px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {toast.message}
    </div>
  );
}
