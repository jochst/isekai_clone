"use client";

import { Bookmark, BookOpen, Copy, Film, Image as ImageIcon, Info, Pencil, Split, Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type MessageAction = "info" | "edit" | "delete" | "branch" | "copy" | "save" | "illustration" | "manga" | "visualNovel";

export interface MessagePopoverProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: MessageAction) => void;
  /** Hide actions that don't apply (e.g. no Edit on streaming messages). */
  hidden?: MessageAction[];
  /** The trigger button; the popover is anchored above it. */
  children: ReactNode;
  className?: string;
}

const ITEMS: { action: MessageAction; label: string; icon: LucideIcon }[] = [
  { action: "info", label: "Info", icon: Info },
  { action: "edit", label: "Edit", icon: Pencil },
  { action: "delete", label: "Delete", icon: Trash2 },
  { action: "branch", label: "Branch", icon: Split },
  { action: "copy", label: "Copy", icon: Copy },
  { action: "save", label: "Save", icon: Bookmark },
  { action: "illustration", label: "Illustration", icon: ImageIcon },
  { action: "manga", label: "Manga", icon: BookOpen },
  { action: "visualNovel", label: "Visual Novel", icon: Film },
];

export function MessagePopover({ open, onClose, onAction, hidden = [], children, className }: MessagePopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {children}
      {open ? (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+6px)] right-0 z-[40] min-w-[170px] rounded-[12px] border border-white/12 bg-[#1b1c4a] p-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.45)] animate-in fade-in zoom-in-95 duration-150"
        >
          {ITEMS.filter((item) => !hidden.includes(item.action)).map(({ action, label, icon: Icon }) => (
            <button
              key={action}
              type="button"
              role="menuitem"
              onClick={() => {
                onClose();
                onAction(action);
              }}
              className="flex h-9 w-full items-center gap-[10px] rounded-[8px] px-3 text-left text-[13px] text-white hover:bg-white/[0.08]"
            >
              <Icon size={16} className="shrink-0 text-white/80" />
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
