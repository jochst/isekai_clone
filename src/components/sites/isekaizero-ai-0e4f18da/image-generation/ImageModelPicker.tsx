"use client";

/**
 * Minimal ImageModelPicker stub (platform catalog only). The image-generation agent owns the full
 * implementation (BYOK group from /api/providers/models); this file is replaced at merge.
 */
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { IMAGE_CATALOG } from "@/lib/sites/isekaizero-ai-0e4f18da/catalog";

export interface ImageModelPickerProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onSelect: (id: string, name: string, costPerImage?: number) => void;
}

export function ImageModelPicker({ open, onClose, value, onSelect }: ImageModelPickerProps) {
  if (!open) return null;
  const rows = IMAGE_CATALOG.filter((m) => m.actions.includes("generate"));

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 animate-in fade-in duration-200" />
      <div className="iz-scroll-thin absolute bottom-0 left-1/2 max-h-[80vh] w-[min(100%,720px)] -translate-x-1/2 overflow-y-auto rounded-t-[16px] border border-white/10 bg-[#11123c] p-4 text-white animate-in slide-in-from-bottom duration-200">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold">Model</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="mb-[6px] mt-[10px] text-[11px] uppercase tracking-[1px] text-white/50">Platform catalog</div>
        <ul className="flex flex-col gap-1">
          {rows.map((m) => {
            const selected = m.id === value;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(m.id, m.name, m.costPerImage);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] border p-3 text-left hover:bg-white/[0.06]",
                    selected ? "border-[rgba(167,185,255,0.6)] bg-[rgba(42,65,228,0.25)]" : "border-transparent",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white text-[18px] font-bold text-[#284bcf]">
                    {m.modelProvider.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{m.name}</span>
                    <span className="iz-line-clamp-2 block text-[12px] leading-4 text-white/60">{m.description}</span>
                  </span>
                  <span className="shrink-0 text-[12px] text-white/70">{Math.round(m.costPerImage * 100)} Mana/Arcane</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
