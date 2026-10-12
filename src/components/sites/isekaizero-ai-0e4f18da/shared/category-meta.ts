import {
  BookOpen,
  Coffee,
  Drama,
  Flower2,
  Landmark,
  Mountain,
  Search,
  Shield,
  Bot,
  Brain,
  ChevronRight,
  Compass,
  DollarSign,
  Eye,
  Flame,
  Ghost,
  Globe,
  GraduationCap,
  Heart,
  HeartCrack,
  Laugh,
  MessageCircle,
  MessagesSquare,
  Moon,
  Rocket,
  Sparkles,
  Star,
  Swords,
  TrendingUp,
  Trophy,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { StoryCategory } from "@/types/isekaizero";

export interface CategoryMeta {
  label: string;
  color: string;
  /** Kebab-case lucide icon name (as used by the target site's data). */
  icon: string;
}

export const CATEGORY_META: Record<StoryCategory, CategoryMeta> = {
  fantasy: { label: "Fantasy", color: "#2563eb", icon: "wand-2" },
  isekai: { label: "Isekai", color: "#7c3aed", icon: "sparkles" },
  sciFi: { label: "Sci-Fi", color: "#0891b2", icon: "rocket" },
  mecha: { label: "Mecha", color: "#475569", icon: "bot" },
  horror: { label: "Horror", color: "#dc2626", icon: "ghost" },
  thriller: { label: "Thriller", color: "#b91c1c", icon: "eye" },
  academy: { label: "Academy", color: "#2563eb", icon: "graduation-cap" },
  romance: { label: "Romance", color: "#db2777", icon: "heart" },
  comedy: { label: "Comedy", color: "#f59e0b", icon: "laugh" },
  adventure: { label: "Adventure", color: "#ff9800", icon: "compass" },
  supernatural: { label: "Supernatural", color: "#a855f7", icon: "moon" },
  sports: { label: "Sports", color: "#4bb543", icon: "trophy" },
  psychological: { label: "Psychological", color: "#a78bfa", icon: "brain" },
  betrayal: { label: "Betrayal", color: "#ef4444", icon: "heart-crack" },
  action: { label: "Action", color: "#ea580c", icon: "swords" },
  romantasy: { label: "Romantasy", color: "#c026d3", icon: "flower-2" },
  drama: { label: "Drama", color: "#9333ea", icon: "drama" },
  mystery: { label: "Mystery", color: "#4f46e5", icon: "search" },
  sliceOfLife: { label: "Slice of Life", color: "#16a34a", icon: "coffee" },
  martialArts: { label: "Martial Arts", color: "#b45309", icon: "shield" },
  cultivation: { label: "Cultivation", color: "#0d9488", icon: "mountain" },
  historical: { label: "Historical", color: "#a16207", icon: "landmark" },
};

/** Kebab-case icon name → lucide component. */
export const ICON_BY_NAME: Record<string, LucideIcon> = {
  "wand-2": Wand2,
  sparkles: Sparkles,
  rocket: Rocket,
  bot: Bot,
  ghost: Ghost,
  eye: Eye,
  "graduation-cap": GraduationCap,
  heart: Heart,
  laugh: Laugh,
  compass: Compass,
  moon: Moon,
  trophy: Trophy,
  brain: Brain,
  "heart-crack": HeartCrack,
  flame: Flame,
  "trending-up": TrendingUp,
  "chevron-right": ChevronRight,
  "message-circle": MessageCircle,
  "messages-square": MessagesSquare,
  globe: Globe,
  star: Star,
  "book-open": BookOpen,
  swords: Swords,
  "dollar-sign": DollarSign,
  coffee: Coffee,
  drama: Drama,
  "flower-2": Flower2,
  landmark: Landmark,
  mountain: Mountain,
  search: Search,
  shield: Shield,
};

export function iconByName(name: string): LucideIcon | undefined {
  return ICON_BY_NAME[name];
}

export function categoryIcon(category: StoryCategory): LucideIcon {
  return ICON_BY_NAME[CATEGORY_META[category].icon] ?? Sparkles;
}
