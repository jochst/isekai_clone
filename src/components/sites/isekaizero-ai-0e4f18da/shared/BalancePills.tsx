import Image from "next/image";

import { cn } from "@/lib/utils";

const IMG = "/sites/isekaizero-ai-0e4f18da/shared/images";

/**
 * - `sidebar`: 28px pills, crystal pinned to the left edge, number centered (desktop sidebar).
 * - `compact`: 32px pills with `padding: 0 10px 0 30px` (desktop TopBar).
 * - `crystal-right`: 25px pills, number on the left, 25px crystal overlapping the
 *   right edge (mobile header and PageHeader right slot).
 */
export type BalancePillsVariant = "sidebar" | "compact" | "crystal-right";

export interface BalancePillsProps {
  mana?: number;
  arcane?: number;
  variant?: BalancePillsVariant;
  className?: string;
}

interface PillProps {
  value: number;
  crystal: "blue" | "purple";
  label: string;
  variant: BalancePillsVariant;
  className?: string;
}

function formatBalance(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function Pill({ value, crystal, label, variant, className }: PillProps) {
  const src = `${IMG}/crystal-${crystal}.png`;

  if (variant === "crystal-right") {
    return (
      <span
        className={cn(
          "relative flex h-[25px] w-[37px] shrink-0 items-center rounded-l-[20px] rounded-r-none border border-[rgba(128,128,255,0.5)] bg-[rgba(23,23,38,0.8)] pl-[10px] pr-[18px]",
          className,
        )}
        aria-label={`${label}: ${formatBalance(value)}`}
      >
        <span className="text-[12px] font-bold leading-none text-white">{formatBalance(value)}</span>
        <Image
          src={src}
          alt=""
          width={25}
          height={25}
          className="absolute -top-px left-[20px] h-[25px] w-[25px] max-w-none object-contain"
        />
      </span>
    );
  }

  const compact = variant === "compact";

  return (
    <span
      className={cn(
        "relative flex flex-1 items-center justify-center rounded-[20px] border border-[rgba(128,128,255,0.5)] bg-[rgba(23,23,38,0.8)]",
        compact ? "h-[32px] pl-[30px] pr-[10px]" : "h-[28px] px-[10px]",
        className,
      )}
      aria-label={`${label}: ${formatBalance(value)}`}
    >
      <Image
        src={src}
        alt=""
        width={22}
        height={22}
        className={cn(
          "absolute left-[4px] h-[22px] w-[22px] object-contain",
          compact ? "top-[4px]" : "top-[2px]",
        )}
      />
      <span className={cn("text-[12px] font-bold leading-none text-white", !compact && "ml-[18px]")}>
        {formatBalance(value)}
      </span>
    </span>
  );
}

export function BalancePills({ mana = 0, arcane = 0, variant = "sidebar", className }: BalancePillsProps) {
  const crystalRight = variant === "crystal-right";

  return (
    <div className={cn("flex items-center", crystalRight ? "h-[25px]" : "gap-2", className)}>
      <Pill
        value={mana}
        crystal="blue"
        label="Mana"
        variant={variant}
        className={crystalRight ? "mr-4" : undefined}
      />
      <Pill
        value={arcane}
        crystal="purple"
        label="Arcane"
        variant={variant}
        className={crystalRight ? "mr-[10px]" : undefined}
      />
    </div>
  );
}
