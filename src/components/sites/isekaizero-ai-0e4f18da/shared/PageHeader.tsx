"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CircleHelp } from "lucide-react";

import { cn } from "@/lib/utils";

import { BalancePills } from "./BalancePills";

export interface PageHeaderProps {
  title: string;
  /** Replaces the default right slot (balance pills + help icon). */
  right?: React.ReactNode;
  mana?: number;
  arcane?: number;
  className?: string;
}

/** 64px "← Title" header used by settings / LLMs / image generation pages. */
export function PageHeader({ title, right, mana = 0, arcane = 0, className }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn("sticky top-0 z-40 flex h-16 w-full shrink-0 items-center bg-[#11123c]", className)}
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="mx-[11px] my-[3px] flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-white"
      >
        <ArrowLeft size={24} strokeWidth={2} aria-hidden />
      </button>
      <h1 className="ml-1 truncate font-sans text-[18px] font-medium leading-6 text-white">{title}</h1>
      <div className="flex flex-1 items-center justify-end pr-4">
        {right ?? (
          <>
            <BalancePills mana={mana} arcane={arcane} variant="crystal-right" />
            <button
              type="button"
              aria-label="Help"
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center text-white"
            >
              <CircleHelp size={24} strokeWidth={2} aria-hidden />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
