import { cn } from "@/lib/utils";
import type { Character } from "@/types/isekaizero";

export interface CharacterPortraitProps {
  character: Character;
  className?: string;
  /** Overlay the character name along the bottom edge. */
  showName?: boolean;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Gradient portrait tile with a centered glyph, a soft top highlight and the character's initials.
 * Fills its parent (`absolute inset-0`). No external images.
 */
export function CharacterPortrait({ character, className, showName = false }: CharacterPortraitProps) {
  if (character.imageUrl?.startsWith("/api/imports/assets/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={character.imageUrl} alt={character.name} className={cn("absolute inset-0 h-full w-full object-cover", className)} />;
  }
  const [g0, g1] = character.gradient;

  return (
    <div
      aria-label={character.name}
      role="img"
      className={cn("@container absolute inset-0 overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(180deg, ${g0}, ${g1})` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.35),transparent_60%)]" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[45cqw] leading-none [filter:drop-shadow(0_4px_10px_rgba(0,0,0,0.4))]">
        {character.glyph}
      </span>
      <span className="absolute left-[6px] top-[5px] font-[family-name:var(--font-roboto)] text-[10px] font-bold leading-none tracking-[0.5px] text-white/70">
        {initials(character.name)}
      </span>
      {showName ? (
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(rgba(0,0,0,0),rgba(0,0,0,0.7))] px-[6px] pb-[5px] pt-[14px] text-center font-[family-name:var(--font-roboto)] text-[11px] font-medium leading-[13px] text-white">
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{character.name}</span>
        </div>
      ) : null}
    </div>
  );
}
