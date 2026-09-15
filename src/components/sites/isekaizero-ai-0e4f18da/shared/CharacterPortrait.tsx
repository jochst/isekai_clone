import type { Character } from "@/types/isekaizero";
import { cn } from "@/lib/utils";

/**
 * Minimal gradient portrait tile with the character glyph.
 * Fills its (relatively positioned) parent.
 */
export function CharacterPortrait({ character, className }: { character: Character; className?: string }) {
  const [g0, g1] = character.gradient;
  return (
    <div
      role="img"
      aria-label={character.name}
      className={cn("absolute inset-0 flex items-center justify-center", className)}
      style={{ backgroundImage: `linear-gradient(180deg, ${g0}, ${g1})` }}
    >
      <span className="select-none text-[24px]">{character.glyph}</span>
    </div>
  );
}
