"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { Bell, Music, Download, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { BalancePills } from "./BalancePills";

export const IZ_IMG = "/sites/isekaizero-ai-0e4f18da/shared/images";

const COLLAPSED_STORAGE_KEY = "iz.sidebar-collapsed";

export type NavKey = "home" | "explore" | "creation" | "chats" | "profile";

export type NavIcon =
  | { kind: "png"; name: "home" | "explore" | "creation" | "chat" | "profile" }
  | { kind: "lucide"; Icon: LucideIcon; size: number }
  | { kind: "static"; src: string; size: number };

export interface NavItem {
  key: NavKey | "music" | "store" | "notifications" | "imports";
  label: string;
  href: string;
  icon: NavIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: "home", label: "Home", href: "/", icon: { kind: "png", name: "home" } },
  { key: "explore", label: "Explore", href: "/explore", icon: { kind: "png", name: "explore" } },
  { key: "imports", label: "Import library", href: "/imports", icon: { kind: "lucide", Icon: Download, size: 22 } },
  { key: "creation", label: "Creation", href: "/creation/generate-image", icon: { kind: "png", name: "creation" } },
  { key: "chats", label: "Chats", href: "/chats", icon: { kind: "png", name: "chat" } },
  { key: "music", label: "Music", href: "#", icon: { kind: "lucide", Icon: Music, size: 22 } },
  { key: "store", label: "Arcane Store", href: "#", icon: { kind: "static", src: `${IZ_IMG}/crystal-purple.png`, size: 24 } },
  { key: "notifications", label: "Notifications", href: "#", icon: { kind: "lucide", Icon: Bell, size: 24 } },
  { key: "profile", label: "Profile", href: "/default-chat-settings", icon: { kind: "png", name: "profile" } },
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

/** Renders the PNG (gradient when active, white otherwise), a Lucide icon, or a static image. */
export function NavIconImage({ icon, active, size, className }: NavIconImageProps) {
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
  const { Icon } = icon;
  return (
    <Icon
      size={icon.size}
      strokeWidth={2}
      aria-hidden
      className={cn(active ? "text-[#a7b9ff]" : "text-[rgba(255,255,255,0.6)]", className)}
    />
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
