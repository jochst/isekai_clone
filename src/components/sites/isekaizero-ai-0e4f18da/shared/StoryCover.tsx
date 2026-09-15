import type { Storyline } from "@/types/isekaizero";
import { cn } from "@/lib/utils";

/**
 * Minimal locally generated cover: 3-stop gradient + centered glyph.
 * Fills its (relatively positioned) parent.
 */
export function StoryCover({
  cover,
  title,
  className,
  mode = "portrait",
}: {
  cover: Storyline["cover"];
  title: string;
  className?: string;
  mode?: "portrait" | "landscape";
}) {
  const [g0, g1, g2] = cover.gradient;
  return (
    <div
      role="img"
      aria-label={title}
      className={cn("absolute inset-0 flex items-center justify-center", className)}
      style={{ backgroundImage: `linear-gradient(160deg, ${g0} 0%, ${g1} 55%, ${g2} 100%)` }}
    >
      <span
        className={cn(
          "select-none drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]",
          mode === "landscape" ? "text-[96px]" : "text-[56px]",
        )}
      >
        {cover.glyph}
      </span>
    </div>
  );
}
