import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Storyline } from "@/types/isekaizero";

type CoverPattern = Storyline["cover"]["pattern"];

/** CSS-only texture layers (screen-blended over the base gradient). */
const PATTERN_STYLE: Record<CoverPattern, CSSProperties> = {
  rays: {
    backgroundImage:
      "repeating-conic-gradient(from 200deg at 70% 30%, rgba(255,255,255,0.18) 0deg 6deg, transparent 6deg 18deg)",
  },
  grid: {
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
    backgroundSize: "24px 24px, 24px 24px",
    backgroundPosition: "0 0, 0 0",
  },
  waves: {
    backgroundImage:
      "repeating-radial-gradient(circle at 50% 120%, rgba(255,255,255,0.14) 0 8px, transparent 8px 26px)",
  },
  stars: {
    backgroundImage:
      "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1.5px), radial-gradient(circle at 40% 80%, #fff 1px, transparent 1.5px), radial-gradient(circle at 85% 20%, #fff 1.2px, transparent 1.8px)",
    backgroundSize: "90px 90px",
  },
  dots: {
    backgroundImage: "radial-gradient(rgba(255,255,255,0.22) 1.5px, transparent 2px)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0",
  },
};

export interface StoryCoverProps {
  cover: Storyline["cover"];
  title: string;
  className?: string;
  /** `portrait` scales the glyph with the box width (34%); `landscape` uses the fixed 96px hero size. */
  mode?: "portrait" | "landscape";
  /** Big faded uppercase title along the bottom edge. */
  watermark?: boolean;
}

/**
 * Locally generated cover art: a 3-stop gradient, a CSS pattern layer, a centered emoji glyph,
 * a bottom vignette and an optional faded title watermark. No external images.
 */
export function StoryCover({ cover, title, className, mode = "portrait", watermark = true }: StoryCoverProps) {
  const [g0, g1, g2] = cover.gradient;

  return (
    <div
      aria-hidden="true"
      className={cn("@container absolute inset-0 overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(160deg, ${g0} 0%, ${g1} 55%, ${g2} 100%)` }}
    >
      <div className="absolute inset-0 opacity-35 mix-blend-screen" style={PATTERN_STYLE[cover.pattern]} />
      <span
        className={cn(
          "absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 select-none leading-none [filter:drop-shadow(0_6px_14px_rgba(0,0,0,0.45))]",
          mode === "landscape" ? "text-[96px]" : "text-[34cqw]",
        )}
      >
        {cover.glyph}
      </span>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_40%,rgba(0,0,0,0.35)_100%)]" />
      {watermark ? (
        <div className="absolute bottom-[10px] left-[10px] right-[10px] break-words font-[family-name:var(--font-roboto)] text-[18px] font-bold uppercase leading-[1.05] tracking-[1px] text-white/[0.14]">
          {title}
        </div>
      ) : null}
    </div>
  );
}
