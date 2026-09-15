import {
  Bot,
  Brain,
  Compass,
  Ghost,
  GraduationCap,
  Heart,
  HeartCrack,
  Laugh,
  Rocket,
  Sparkles,
  Sword,
  Trophy,
  Wand,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { StoryCategory } from "@/types/isekaizero";

export interface CategoryMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const CATEGORY_META: Record<StoryCategory, CategoryMeta> = {
  fantasy: { label: "Fantasy", color: "rgb(72, 118, 240)", icon: Wand },
  isekai: { label: "Isekai", color: "rgb(138, 43, 226)", icon: Sparkles },
  sciFi: { label: "Sci-Fi", color: "rgb(0, 150, 199)", icon: Rocket },
  mecha: { label: "Mecha", color: "rgb(96, 108, 130)", icon: Bot },
  horror: { label: "Horror", color: "rgb(120, 20, 40)", icon: Ghost },
  thriller: { label: "Thriller", color: "rgb(180, 60, 20)", icon: Zap },
  academy: { label: "Academy", color: "rgb(46, 125, 50)", icon: GraduationCap },
  romance: { label: "Romance", color: "rgb(220, 60, 120)", icon: Heart },
  comedy: { label: "Comedy", color: "rgb(240, 160, 30)", icon: Laugh },
  adventure: { label: "Adventure", color: "rgb(30, 140, 110)", icon: Compass },
  supernatural: { label: "Supernatural", color: "rgb(90, 70, 180)", icon: Sparkles },
  sports: { label: "Sports", color: "rgb(230, 100, 30)", icon: Trophy },
  psychological: { label: "Psychological", color: "rgb(110, 40, 160)", icon: Brain },
  betrayal: { label: "Betrayal", color: "rgb(160, 30, 60)", icon: HeartCrack },
};

const ICON_BY_NAME: Record<string, LucideIcon> = {
  brain: Brain,
  "heart-crack": HeartCrack,
  laugh: Laugh,
  sword: Sword,
  sparkles: Sparkles,
  heart: Heart,
  rocket: Rocket,
  compass: Compass,
};

/** Resolve a lucide icon from a kebab-case name; falls back to Sparkles. */
export function categoryIcon(name: string): LucideIcon {
  return ICON_BY_NAME[name] ?? Sparkles;
}
