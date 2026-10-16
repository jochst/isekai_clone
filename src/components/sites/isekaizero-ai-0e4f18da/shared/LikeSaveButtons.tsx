"use client";

import { Bookmark, Heart } from "lucide-react";

import { setCollected, useCollections, type CollectionItem } from "@/lib/sites/isekaizero-ai-0e4f18da/collections";
import { cn } from "@/lib/utils";

type Target = Omit<CollectionItem, "list" | "created">;

/** Like and Save for a storyline or character (listed on Chats → Likes / Saved). */
export function LikeSaveButtons({ target, className }: { target: Target; className?: string }) {
  const items = useCollections();
  const has = (list: CollectionItem["list"]) => !!items?.some((i) => i.list === list && i.kind === target.kind && i.id === target.id);
  const noun = target.kind === "character" ? "character" : "storyline";
  const button = (list: CollectionItem["list"]) => {
    const on = has(list);
    const Icon = list === "likes" ? Heart : Bookmark;
    const label = list === "likes" ? (on ? `Unlike ${noun}` : `Like ${noun}`) : on ? "Remove from saved" : `Save ${noun}`;
    return (
      <button
        type="button"
        aria-pressed={on}
        disabled={items === null}
        onClick={() => void setCollected({ ...target, list }, !on).catch(() => undefined)}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-[18px] border px-3.5 text-[13px] font-semibold transition-colors disabled:opacity-50",
          on ? "border-[rgba(255,168,168,0.6)] bg-[rgba(255,168,168,0.16)]" : "border-white/15 bg-white/[0.06] hover:bg-white/10",
        )}
      >
        <Icon size={15} className={cn(on && "fill-current", on && list === "likes" && "text-[#ff8fa3]")} /> {label}
      </button>
    );
  };
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {button("likes")}
      {button("saved")}
    </div>
  );
}
