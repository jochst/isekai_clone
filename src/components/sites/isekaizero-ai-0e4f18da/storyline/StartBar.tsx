"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bookmark, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Storyline } from "@/types/isekaizero";
import { createChatSession } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";

export interface StartBarProps {
  storyline: Storyline;
  className?: string;
}

const ICON_BUTTON =
  "flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[12px] border border-[rgba(167,185,255,0.35)] bg-[rgba(255,255,255,0.08)] text-white";

/** Sticky (desktop) / fixed (mobile) bar with save + like toggles and the "Start Now" button + play modal. */
export function StartBar({ storyline, className }: StartBarProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const playAsGuest = () => {
    const session = createChatSession(storyline);
    setModalOpen(false);
    router.push(`/chats/${session.id}`);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 flex w-full flex-row items-center gap-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(2,9,32,0.85)] px-[15px] py-[12px] backdrop-blur-[10px]",
          "lg:sticky lg:inset-x-auto lg:bottom-[12px] lg:mt-[24px] lg:rounded-[16px] lg:p-[10px]",
          className,
        )}
      >
        <button
          type="button"
          aria-label={saved ? "Remove bookmark" : "Bookmark"}
          aria-pressed={saved}
          onClick={() => setSaved((v) => !v)}
          className={cn(ICON_BUTTON, saved && "text-[rgb(255,168,168)]")}
        >
          <Bookmark size={22} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={liked ? "Unlike" : "Like"}
          aria-pressed={liked}
          onClick={() => setLiked((v) => !v)}
          className={cn(ICON_BUTTON, liked && "text-[rgb(255,168,168)]")}
        >
          <Heart size={22} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex h-[48px] flex-1 items-center justify-center rounded-[12px] border-[1.5px] border-[rgba(255,168,168,0.7)] bg-[linear-gradient(90deg,rgba(255,168,168,0.25),rgba(42,65,228,0.35)_50%,rgba(167,185,255,0.25))] text-[16px] font-semibold leading-none text-white"
        >
          Start Now
        </button>
      </div>

      {/* Portals only render after a click, so there is no SSR/hydration mismatch. */}
      {modalOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.6)] px-[16px]"
              onClick={() => setModalOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="iz-play-title"
                onClick={(e) => e.stopPropagation()}
                className="relative w-[720px] max-w-[calc(100%-32px)] rounded-[16px] border-[1.5px] border-[rgba(255,168,168,0.7)] bg-[linear-gradient(rgb(17,18,60),rgb(9,25,77))] px-[20px] py-[24px] text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              >
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setModalOpen(false)}
                  className="absolute right-[20px] top-[24px] flex h-[22px] w-[22px] items-center justify-center text-[rgba(255,255,255,0.7)]"
                >
                  <X size={22} aria-hidden="true" />
                </button>
                <h2 id="iz-play-title" className="text-center text-[18px] font-bold leading-[22px]">
                  How do you want to play?
                </h2>
                <p className="mt-[12px] text-center text-[14px] leading-[20px] text-[rgba(255,255,255,0.85)]">
                  Jump in instantly as a guest, or create an account to keep your stories and progress on all your devices.
                </p>
                <div className="mt-[20px] flex flex-col gap-[12px]">
                  <button
                    type="button"
                    onClick={playAsGuest}
                    className="flex h-[48px] items-center justify-center rounded-[24px] border-[1.5px] border-[rgba(255,168,168,0.8)] bg-[linear-gradient(90deg,rgb(23,36,126),rgb(42,65,228))] text-[15px] font-semibold leading-none"
                  >
                    Play as Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => setToast("Accounts are not part of this demo")}
                    className="flex h-[48px] items-center justify-center rounded-[24px] border-[1.5px] border-[rgba(255,168,168,0.8)] bg-[rgba(255,255,255,0.05)] text-[15px] font-semibold leading-none"
                  >
                    Sign Up / Log In
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {toast
        ? createPortal(
            <div
              role="status"
              className="pointer-events-none fixed inset-x-0 bottom-[96px] z-[110] flex justify-center px-[16px]"
            >
              <span className="rounded-[10px] border border-[rgba(255,255,255,0.12)] bg-[rgb(17,18,60)] px-[14px] py-[10px] text-[13px] leading-none text-white shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
                {toast}
              </span>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
