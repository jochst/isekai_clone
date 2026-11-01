"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useId, useSyncExternalStore } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";

import { BalancePills } from "./BalancePills";

export const IZ_IMG = "/sites/isekaizero-ai-0e4f18da/shared/images";

const COLLAPSED_STORAGE_KEY = "iz.sidebar-collapsed";

export type NavKey = "home" | "explore" | "creation" | "chats" | "profile";

export type NavIcon =
  | { kind: "png"; name: "home" | "explore" | "creation" | "chat" | "profile" }
  /** A filled 512×512 path (Ionicons, MIT), drawn white like the PNGs and with their gradient when active. */
  | { kind: "svg"; path: string; size: number }
  | { kind: "static"; src: string; size: number };

export interface NavItem {
  key: NavKey | "music" | "store" | "notifications" | "imports";
  label: string;
  href: string;
  icon: NavIcon;
}

const ION_DOWNLOAD =
  "M376 160H272v153.37l52.69-52.68a16 16 0 0122.62 22.62l-80 80a16 16 0 01-22.62 0l-80-80a16 16 0 0122.62-22.62L240 313.37V160H136a56.06 56.06 0 00-56 56v208a56.06 56.06 0 0056 56h240a56.06 56.06 0 0056-56V216a56.06 56.06 0 00-56-56zM272 48a16 16 0 00-32 0v112h32z";
const ION_MUSICAL_NOTES =
  "M421.84 37.37a25.86 25.86 0 00-22.6-4.46L199.92 86.49A32.3 32.3 0 00176 118v226c0 6.74-4.36 12.56-11.11 14.83l-.12.05-52 18C92.88 383.53 80 402 80 423.91a55.54 55.54 0 0023.23 45.63A54.78 54.78 0 00135.34 480a55.82 55.82 0 0017.75-2.93l.38-.13 21.84-7.94A47.84 47.84 0 00208 423.91v-212c0-7.29 4.77-13.21 12.16-15.07l.21-.06L395 150.14a4 4 0 015 3.86v141.93c0 6.75-4.25 12.38-11.11 14.68l-.25.09-50.89 18.11A49.09 49.09 0 00304 375.92a55.67 55.67 0 0023.23 45.8 54.63 54.63 0 0049.88 7.35l.36-.12 21.84-7.95A47.83 47.83 0 00432 375.92V58a25.74 25.74 0 00-10.16-20.63z";
const ION_NOTIFICATIONS =
  "M440.08 341.31c-1.66-2-3.29-4-4.89-5.93-22-26.61-35.31-42.67-35.31-118 0-39-9.33-71-27.72-95-13.56-17.73-31.89-31.18-56.05-41.12a3 3 0 01-.82-.67C306.6 51.49 282.82 32 256 32s-50.59 19.49-59.28 48.56a3.13 3.13 0 01-.81.65c-56.38 23.21-83.78 67.74-83.78 136.14 0 75.36-13.29 91.42-35.31 118-1.6 1.93-3.23 3.89-4.89 5.93a35.16 35.16 0 00-4.65 37.62c6.17 13 19.32 21.07 34.33 21.07H410.5c14.94 0 28-8.06 34.19-21a35.17 35.17 0 00-4.61-37.66zM256 480a80.06 80.06 0 0070.44-42.13 4 4 0 00-3.54-5.87H189.12a4 4 0 00-3.55 5.87A80.06 80.06 0 00256 480z";

export const NAV_ITEMS: readonly NavItem[] = [
  { key: "home", label: "Home", href: "/", icon: { kind: "png", name: "home" } },
  { key: "explore", label: "Explore", href: "/explore", icon: { kind: "png", name: "explore" } },
  { key: "imports", label: "Import library", href: "/imports", icon: { kind: "svg", path: ION_DOWNLOAD, size: 22 } },
  { key: "creation", label: "Creation", href: "/creation", icon: { kind: "png", name: "creation" } },
  { key: "chats", label: "Chats", href: "/chats", icon: { kind: "png", name: "chat" } },
  { key: "music", label: "Music", href: "/music", icon: { kind: "svg", path: ION_MUSICAL_NOTES, size: 22 } },
  { key: "store", label: "Arcane Store", href: "#", icon: { kind: "static", src: `${IZ_IMG}/crystal-purple.png`, size: 24 } },
  { key: "notifications", label: "Notifications", href: "#", icon: { kind: "svg", path: ION_NOTIFICATIONS, size: 22 } },
  { key: "profile", label: "Profile", href: "/profile", icon: { kind: "png", name: "profile" } },
];

/** The primary items that appear in the TopBar / MobileTabBar. */
export const PRIMARY_NAV_KEYS: readonly NavKey[] = ["home", "explore", "creation", "chats", "profile"];

export function activeNavFromPath(pathname: string | null): NavKey | undefined {
  if (!pathname) return undefined;
  if (pathname === "/") return "home";
  if (pathname.startsWith("/explore")) return "explore";
  if (pathname.startsWith("/creation")) return "creation";
  if (pathname.startsWith("/chats")) return "chats";
  if (
    pathname.startsWith("/default-chat-settings") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile")
  ) {
    return "profile";
  }
  return undefined;
}

/** Resolves the active nav key from an explicit override or the current pathname. */
export function useActiveNav(override?: NavKey): NavKey | undefined {
  const pathname = usePathname();
  return override ?? activeNavFromPath(pathname);
}

export interface NavIconImageProps {
  icon: NavIcon;
  active: boolean;
  /** Rendered box size in px (icons scale to fit). */
  size: number;
  className?: string;
}

/** Renders the PNG or SVG path (gradient when active, white otherwise), or a static image. */
export function NavIconImage({ icon, active, size, className }: NavIconImageProps) {
  const gradientId = useId();
  if (icon.kind === "png") {
    const src = `${IZ_IMG}/nav-${icon.name}-${active ? "gradient" : "white"}.png`;
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn("object-contain", className)}
      />
    );
  }
  if (icon.kind === "static") {
    return (
      <Image
        src={icon.src}
        alt=""
        width={icon.size}
        height={icon.size}
        className={cn("object-contain", className)}
      />
    );
  }
  // Same look as the nav PNGs: white, or pink at the top fading to periwinkle when active.
  return (
    <svg viewBox="0 0 512 512" width={icon.size} height={icon.size} aria-hidden className={className}>
      {active ? (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffa8a8" />
            <stop offset="1" stopColor="#a7b9ff" />
          </linearGradient>
        </defs>
      ) : null}
      <path d={icon.path} fill={active ? `url(#${gradientId})` : "#fff"} />
    </svg>
  );
}

/*
 * Collapsed state lives in localStorage and is exposed through a tiny external
 * store so `useSyncExternalStore` can hydrate safely (server snapshot = expanded)
 * without a setState-in-effect. `memoryCollapsed` is the fallback when
 * localStorage is unavailable (private mode / blocked).
 */
let memoryCollapsed = false;
const collapsedListeners = new Set<() => void>();

function readCollapsed(): boolean {
  try {
    const stored = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return stored === null ? memoryCollapsed : stored === "1";
  } catch {
    return memoryCollapsed;
  }
}

function writeCollapsed(value: boolean): void {
  memoryCollapsed = value;
  try {
    window.localStorage.setItem(COLLAPSED_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // localStorage unavailable — memoryCollapsed keeps the state for this session.
  }
  collapsedListeners.forEach((listener) => listener());
}

function subscribeCollapsed(listener: () => void): () => void {
  collapsedListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    collapsedListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getServerCollapsed(): boolean {
  return false;
}

export interface SidebarProps {
  active?: NavKey;
  mana?: number;
  arcane?: number;
  className?: string;
}

export function Sidebar({ active: activeProp, mana = 0, arcane = 0, className }: SidebarProps) {
  const active = useActiveNav(activeProp);
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, getServerCollapsed);

  const toggle = useCallback(() => {
    writeCollapsed(!readCollapsed());
  }, []);

  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        "iz-sidebar-gradient flex h-full shrink-0 flex-col py-5 transition-[width] duration-200",
        collapsed ? "w-16" : "w-[240px]",
        className,
      )}
      data-collapsed={collapsed ? "true" : "false"}
    >
      {/* Logo row */}
      <div
        className={cn(
          "mb-5 flex h-8 items-center",
          collapsed ? "justify-center px-0" : "justify-between px-5",
        )}
      >
        {!collapsed && (
          <Link href="/" aria-label="ISEKAI ZERO home" className="flex h-[27px] w-[140px] items-center">
            <Image
              src={`${IZ_IMG}/logo-word.png`}
              alt="ISEKAI ZERO"
              width={140}
              height={27}
              priority
              className="h-[27px] w-[140px] object-contain"
            />
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white"
        >
          <CollapseIcon size={22} strokeWidth={2} aria-hidden />
        </button>
      </div>

      {/* Nav list */}
      <nav className={cn("flex-1", collapsed ? "px-2" : "px-3")} aria-label="Primary">
        <ul className="m-0 list-none p-0">
          {NAV_ITEMS.map((item) => {
            const isActive = active !== undefined && item.key === active;
            return (
              <li key={item.key} className="mb-1">
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-12 cursor-pointer items-center rounded-[12px]",
                    collapsed ? "justify-center px-0 py-3" : "px-4 py-3",
                    isActive && "bg-[rgba(167,185,255,0.12)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center",
                      !collapsed && "mr-[14px]",
                    )}
                  >
                    <NavIconImage icon={item.icon} active={isActive} size={24} />
                  </span>
                  {!collapsed && (
                    <span
                      className={cn(
                        "whitespace-nowrap text-[15px] leading-none",
                        isActive
                          ? "iz-gradient-text iz-gradient-accent font-[family-name:var(--font-roboto)] font-bold"
                          : "font-[family-name:var(--font-poppins)] font-medium text-[rgba(255,255,255,0.6)]",
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <>
          {/* Balance pills */}
          <BalancePills mana={mana} arcane={arcane} variant="sidebar" className="mb-4 h-[28px] px-3" />

          {/* App store badges */}
          <div className="flex flex-col gap-[6px] px-3 pb-2">
            <AppBadge
              href="#"
              iconSrc={`${IZ_IMG}/badge-google-play.png`}
              line1="GET IT ON"
              line2="Google Play"
            />
            <AppBadge
              href="#"
              iconSrc={`${IZ_IMG}/badge-app-store.png`}
              line1="Download on the"
              line2="App Store"
            />
          </div>
        </>
      )}
    </aside>
  );
}

interface AppBadgeProps {
  href: string;
  iconSrc: string;
  line1: string;
  line2: string;
}

function AppBadge({ href, iconSrc, line1, line2 }: AppBadgeProps) {
  return (
    <a
      href={href}
      className="flex h-[46px] cursor-pointer items-center rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] px-3 py-2"
    >
      <Image
        src={iconSrc}
        alt=""
        width={20}
        height={20}
        className="mr-[10px] h-5 w-5 shrink-0 object-contain"
      />
      <span className="flex flex-col justify-center">
        <span className="text-[9px] leading-[11px] text-[rgba(255,255,255,0.5)]">{line1}</span>
        <span className="text-[12px] font-semibold leading-[15px] text-white">{line2}</span>
      </span>
    </a>
  );
}
