"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/creation/generate-image", label: "Image" },
  { href: "/creation/generate-video", label: "Video" },
];

/** Image / Video switch shown under the Creation page header. */
export function CreationTabs() {
  const pathname = usePathname();
  return (
    <div className="flex justify-center px-5 pt-4">
      <nav aria-label="Creation tools" className="flex h-[34px] rounded-[17px] bg-black/25 p-[3px]">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex h-7 items-center rounded-[14px] px-5 text-[13px] font-semibold transition-colors", active ? "bg-[rgb(42,65,228)] text-white" : "text-white/60 hover:text-white")}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
