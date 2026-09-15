"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Search, User } from "lucide-react";

import { cn } from "@/lib/utils";

import { BalancePills } from "./BalancePills";
import { IZ_IMG, NAV_ITEMS, NavIconImage, useActiveNav, type NavKey } from "./Sidebar";

const TOPBAR_KEYS: readonly NavKey[] = ["home", "explore", "creation", "chats"];

export interface TopBarProps {
  active?: NavKey;
  mana?: number;
  arcane?: number;
  className?: string;
}

/** 60px top navigation bar used on detail/settings pages at >=1024px. */
export function TopBar({ active: activeProp, mana = 0, arcane = 0, className }: TopBarProps) {
  const active = useActiveNav(activeProp);
  const items = NAV_ITEMS.filter((item) => (TOPBAR_KEYS as readonly string[]).includes(item.key));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-[60px] w-full shrink-0 items-center gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[#11123c] px-4",
        className,
      )}
    >
      <Link href="/" aria-label="ISEKAI ZERO home" className="mr-4 flex h-7 w-[140px] shrink-0 items-center">
        <Image
          src={`${IZ_IMG}/logo-word.png`}
          alt="ISEKAI ZERO"
          width={140}
          height={28}
          priority
          className="h-7 w-[140px] object-contain"
        />
      </Link>

      <nav aria-label="Primary" className="flex items-center gap-3">
        {items.map((item) => {
          const isActive = active !== undefined && item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="flex h-[38px] cursor-pointer items-center gap-2 rounded-[10px] px-[14px] py-2"
            >
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
                <NavIconImage icon={item.icon} active={isActive} size={22} />
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-[14px] leading-none",
                  isActive
                    ? "iz-gradient-text iz-gradient-accent font-[family-name:var(--font-roboto)] font-bold"
                    : "font-[family-name:var(--font-poppins)] font-medium text-[rgba(255,255,255,0.6)]",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <label className="ml-auto flex h-10 max-w-[300px] flex-1 items-center gap-2 rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-[14px]">
        <Search size={18} strokeWidth={2} aria-hidden className="shrink-0 text-[rgba(255,255,255,0.5)]" />
        <input
          type="search"
          placeholder="Search storylines, @creators..."
          aria-label="Search storylines and creators"
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-none text-white outline-none placeholder:text-[rgba(255,255,255,0.4)]"
        />
      </label>

      <BalancePills mana={mana} arcane={arcane} variant="compact" className="shrink-0" />

      <button
        type="button"
        aria-label="Notifications"
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white"
      >
        <Bell size={22} strokeWidth={2} aria-hidden />
      </button>
      <Link
        href="/default-chat-settings"
        aria-label="Profile"
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white"
      >
        <User size={22} strokeWidth={2} aria-hidden />
      </Link>
    </header>
  );
}

export interface MobileHeaderProps {
  mana?: number;
  arcane?: number;
  className?: string;
}

/** 50px mobile header (<1024px): logo, two balance pills, bell. */
export function MobileHeader({ mana = 0, arcane = 0, className }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-[50px] w-full shrink-0 items-center justify-between bg-[#11123c] px-[15px]",
        className,
      )}
    >
      <Link href="/" aria-label="ISEKAI ZERO home" className="flex h-[27px] w-[140px] shrink-0 items-center">
        <Image
          src={`${IZ_IMG}/logo-word.png`}
          alt="ISEKAI ZERO"
          width={140}
          height={27}
          priority
          className="h-[27px] w-[140px] object-contain"
        />
      </Link>
      <div className="flex items-center">
        <BalancePills mana={mana} arcane={arcane} variant="crystal-right" />
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-7 w-7 cursor-pointer items-center justify-center text-white"
        >
          <Bell size={28} strokeWidth={2} aria-hidden className="fill-white" />
        </button>
      </div>
    </header>
  );
}
