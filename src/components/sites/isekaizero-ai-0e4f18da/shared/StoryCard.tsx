import Link from "next/link";
import { BookOpen, DollarSign, Globe, MessageCircle, MessagesSquare, Star, Swords, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Storyline } from "@/types/isekaizero";
import { StoryCover } from "./StoryCover";
import { formatCountLower } from "./format";

export interface StoryCardProps {
  storyline: Storyline;
  /** `row`: fixed 170×283 card for horizontal scrollers. `grid`: fluid card with `aspect-ratio: 170/283`. */
  variant?: "row" | "grid";
  className?: string;
}

interface Badge {
  key: keyof Storyline["flags"];
  Icon: LucideIcon;
  /** Tailwind background utility. */
  bg: string;
  label: string;
}

/** Site order: public, featured, visual novel, dungeon mind, monetized. */
const BADGES: Badge[] = [
  { key: "public", Icon: Globe, bg: "bg-[rgb(76,175,80)]", label: "Public" },
  { key: "featured", Icon: Star, bg: "bg-[rgb(218,165,32)]", label: "Featured" },
  { key: "visualNovelReady", Icon: BookOpen, bg: "bg-[rgba(138,43,226,0.8)]", label: "Visual novel ready" },
  { key: "dungeonMind", Icon: Swords, bg: "bg-[rgba(255,152,0,0.8)]", label: "Dungeon mind" },
  { key: "monetized", Icon: DollarSign, bg: "bg-[rgba(34,197,94,0.8)]", label: "Monetized" },
];

function BadgeStrip({ flags }: { flags: Storyline["flags"] }) {
  const active = BADGES.filter((badge) => flags[badge.key]);
  if (active.length === 0) return null;
  return (
    <div className="absolute left-[8px] top-[10px] z-[3] flex flex-row gap-[3px]">
      {active.map(({ key, Icon, bg, label }) => (
        <span key={key} title={label} className={cn("flex h-[16px] w-[16px] items-center justify-center rounded-[3px]", bg)}>
          <Icon size={10} strokeWidth={2.5} className="text-white" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

function MaturePill() {
  return (
    <span className="absolute right-[8px] top-[8px] z-[3] flex h-[20px] items-center justify-center rounded-[16px] border border-[rgb(180,83,9)] bg-[rgb(180,83,9)] px-[8px] font-[family-name:var(--font-roboto)] text-[10px] font-medium leading-none text-white">
      M
    </span>
  );
}

export function StoryCard({ storyline, variant = "row", className }: StoryCardProps) {
  const { id, title, description, creator, stats, flags, cover } = storyline;
  const isGrid = variant === "grid";

  return (
    <Link
      href={`/storylines/${id}`}
      aria-label={title}
      className={cn(
        "iz-border-card block shrink-0 rounded-[16px] p-[2px] text-white",
        isGrid
          ? "w-full aspect-[170/283]"
          : "mx-[4px] mb-[8px] h-[258px] w-[158px] sm:h-[283.33px] sm:w-[170px]",
        className,
      )}
    >
      <div className="h-full w-full overflow-hidden rounded-[16px] bg-[rgb(16,18,20)]">
        <div className="relative h-full w-full bg-[rgb(32,34,36)]">
          {/* Cover art — 223.45/279.33 = 80% of the inner card */}
          <div className="absolute left-0 top-0 h-[80%] w-full">
            <StoryCover cover={cover} title={title} />
          </div>

          {/* Dark gradient overlay over the whole card */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_30%,rgb(0,0,0)_80%,rgb(0,0,0)_100%)]" />

          <BadgeStrip flags={flags} />
          {flags.mature ? <MaturePill /> : null}

          {/* Text block — anchored to the bottom with the 40px gradient padding */}
          <div className="absolute inset-x-0 bottom-0 z-[2] flex flex-col px-[10px] pb-[10px] pt-[40px]">
            <h2
              className={cn(
                "iz-line-clamp-2 mb-[3px] font-[family-name:var(--font-roboto)] font-bold text-white",
                isGrid ? "text-[15px] leading-[19px]" : "text-[14px] leading-[18px]",
              )}
            >
              {title}
            </h2>
            <p
              className={cn(
                "mb-[6px] font-[family-name:var(--font-roboto)] text-[12px] font-normal leading-[15px] text-[rgb(224,224,224)] opacity-85",
                isGrid ? "iz-line-clamp-2" : "iz-line-clamp-3",
              )}
            >
              {description}
            </p>
            <div className="flex h-[14px] flex-row items-center justify-between">
              <span className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap font-[family-name:var(--font-roboto)] text-[11px] leading-[13px] text-white">
                @{creator.handle}
              </span>
              <span className={cn("flex flex-row items-center", isGrid ? "gap-[8px]" : "gap-[2px]")}>
                <span className="flex flex-row items-center gap-[2px]">
                  <MessageCircle size={12} className="text-white" aria-hidden="true" />
                  <span className="font-[family-name:var(--font-roboto)] text-[11px] leading-[13px] text-white">
                    {formatCountLower(stats.plays)}
                  </span>
                </span>
                {isGrid ? (
                  <span className="flex flex-row items-center gap-[2px]">
                    <MessagesSquare size={12} className="text-white" aria-hidden="true" />
                    <span className="font-[family-name:var(--font-roboto)] text-[11px] leading-[13px] text-white">
                      {formatCountLower(stats.chats)}
                    </span>
                  </span>
                ) : null}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
