"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { NAV_ITEMS, NavIconImage, PRIMARY_NAV_KEYS, useActiveNav, type NavKey } from "./Sidebar";

export interface MobileTabBarProps {
  active?: NavKey;
  className?: string;
}

/** Floating 64px pill tab bar shown below 1024px: Home, Explore, Creation, Chats, Profile. */
export function MobileTabBar({ active: activeProp, className }: MobileTabBarProps) {
  const active = useActiveNav(activeProp);
  const items = NAV_ITEMS.filter((item) => (PRIMARY_NAV_KEYS as readonly string[]).includes(item.key));

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-6 bottom-4 z-50 flex h-[64px] items-center justify-around rounded-[32px] border-[1.5px] border-transparent shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-[12px]",
        "[background:linear-gradient(rgba(17,18,60,0.92),rgba(17,18,60,0.92))_padding-box,linear-gradient(135deg,rgb(167,185,255),rgb(255,168,168))_border-box]",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = active !== undefined && item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full",
              isActive && "bg-[rgba(167,185,255,0.15)]",
            )}
          >
            <NavIconImage icon={item.icon} active={isActive} size={28} className="h-7 w-7" />
          </Link>
        );
      })}
    </nav>
  );
}
