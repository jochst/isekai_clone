"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { MobileTabBar } from "./MobileTabBar";
import { IZ_IMG, Sidebar, useActiveNav, type NavKey } from "./Sidebar";
import { MobileHeader, TopBar } from "./TopBar";

export type AppShellNav = "sidebar" | "topbar" | "none";

export interface AppShellProps {
  children: React.ReactNode;
  /** Desktop navigation variant. Mobile always gets the header + tab bar unless `none`. */
  nav?: AppShellNav;
  /** Active nav item; derived from the pathname when omitted. */
  active?: NavKey;
  mana?: number;
  arcane?: number;
  /** Draws the faint "V" crest behind the page content. */
  backdrop?: boolean;
  className?: string;
}

/** Faint app crest drawn behind page content (bottom-center, 560px wide, 25% opacity). */
export function AppBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-0 left-1/2 -z-10 w-[560px] max-w-full -translate-x-1/2 opacity-25",
        className,
      )}
    >
      <Image
        src={`${IZ_IMG}/app-background.png`}
        alt=""
        width={375}
        height={311}
        className="h-auto w-full object-contain"
      />
    </div>
  );
}

export function AppShell({
  children,
  nav = "sidebar",
  active: activeProp,
  mana = 0,
  arcane = 0,
  backdrop = false,
  className,
}: AppShellProps) {
  const active = useActiveNav(activeProp);
  const hasMobileChrome = nav !== "none";

  return (
    <div className={cn("flex h-screen w-full bg-[#020920] text-white", className)}>
      {nav === "sidebar" && (
        <Sidebar active={active} mana={mana} arcane={arcane} className="hidden lg:flex" />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {hasMobileChrome && <MobileHeader mana={mana} arcane={arcane} className="lg:hidden" />}
        {nav === "topbar" && (
          <TopBar active={active} mana={mana} arcane={arcane} className="hidden lg:flex" />
        )}

        <main
          className={cn(
            "iz-scroll-thin relative isolate flex-1 overflow-y-auto",
            hasMobileChrome && "pb-24 lg:pb-0",
          )}
        >
          {backdrop && <AppBackdrop />}
          {children}
        </main>

        {nav === "sidebar" && <MobileTabBar active={active} className="lg:hidden" />}
      </div>
    </div>
  );
}
