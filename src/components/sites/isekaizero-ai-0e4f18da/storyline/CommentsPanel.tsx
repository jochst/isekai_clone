"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Flame, Flag, MessageCircle, Reply, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommentsPanelProps {
  storylineId: string;
  /** Total shown in the header ("{n} Comments"). */
  count: number;
  className?: string;
}

interface MockComment {
  handle: string;
  text: string;
  likes: number;
  /** Zero-based month + day, rendered as "May 31". */
  month: number;
  day: number;
  gradient: [string, string];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Original, friendly filler comments; five are picked per storyline id. */
const COMMENT_POOL: MockComment[] = [
  { handle: "midnight_taco", text: "Blessed content, thank you for this one 🙏", likes: 10, month: 4, day: 31, gradient: ["#3b5bdb", "#82c0ff"] },
  { handle: "hexwaves", text: "Second playthrough and the cast still surprises me. The pacing is so good.", likes: 7, month: 5, day: 2, gradient: ["#7b2cbf", "#ff8fab"] },
  { handle: "lantern_owl", text: "Went in blind, came out with a new favourite. Highly recommend the second scenario.", likes: 5, month: 5, day: 4, gradient: ["#0f766e", "#5eead4"] },
  { handle: "quietstorm", text: "The opening hooked me instantly. Can't wait for the next update!", likes: 12, month: 5, day: 6, gradient: ["#b45309", "#fcd34d"] },
  { handle: "nova.kite", text: "Every character feels distinct, which is rare. Great work, creator ✨", likes: 4, month: 5, day: 9, gradient: ["#9d174d", "#f9a8d4"] },
  { handle: "saltmarsh", text: "Chose the wrong door in chapter two and honestly it was still a great ride.", likes: 3, month: 5, day: 11, gradient: ["#1d4ed8", "#a7b9ff"] },
  { handle: "pixel_pilgrim", text: "This is the kind of story I keep coming back to on late nights.", likes: 8, month: 5, day: 13, gradient: ["#4c1d95", "#c4b5fd"] },
  { handle: "emberline", text: "Loved the worldbuilding. Small details everywhere if you look for them.", likes: 6, month: 5, day: 15, gradient: ["#dc2626", "#fda4af"] },
];

function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickComments(storylineId: string): MockComment[] {
  const start = hashString(storylineId) % COMMENT_POOL.length;
  return Array.from({ length: 5 }, (_, i) => COMMENT_POOL[(start + i) % COMMENT_POOL.length]);
}

/** "{n} Comments" header, sort chip, composer, five mock comments and a "Load more" button. */
export function CommentsPanel({ storylineId, count, className }: CommentsPanelProps) {
  const comments = useMemo(() => pickComments(storylineId), [storylineId]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  return (
    <section className={cn("mt-[16px] text-white", className)}>
      <div className="flex flex-row items-center justify-between px-[12px]">
        <h2 className="iz-gradient-text bg-[linear-gradient(to_right,rgb(255,255,255),rgb(255,191,191))] font-[family-name:var(--font-roboto)] text-[16px] font-semibold leading-[19px]">
          {count} Comments
        </h2>
        <button
          type="button"
          className="flex h-[34px] flex-row items-center gap-[4px] rounded-[8px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] px-[10px] py-[6px]"
        >
          <Flame size={18} className="text-[rgb(184,192,216)]" aria-hidden="true" />
          <span className="text-[14px] leading-none text-[rgb(184,192,216)]">Best</span>
          <ChevronDown size={20} className="text-[rgb(184,192,216)]" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-[12px] mt-[16px] flex h-[48px] flex-row items-center gap-[10px] rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-[14px]">
        <MessageCircle size={18} className="shrink-0 text-[rgba(255,255,255,0.5)]" aria-hidden="true" />
        <input
          type="text"
          placeholder="Join the conversation"
          aria-label="Write a comment"
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-[rgba(255,255,255,0.4)]"
        />
      </div>

      {comments.map((comment) => {
        const isLiked = liked[comment.handle] === true;
        return (
          <article key={comment.handle} className="flex flex-row gap-[10px] px-[12px] pt-[14px]">
            <span
              aria-hidden="true"
              className="h-[36px] w-[36px] shrink-0 rounded-[18px]"
              style={{ backgroundImage: `linear-gradient(135deg, ${comment.gradient[0]}, ${comment.gradient[1]})` }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-row items-baseline">
                <span className="text-[12px] font-semibold leading-[15px] text-[rgb(255,168,168)]">@{comment.handle}</span>
                <span className="ml-[6px] text-[11px] leading-[13px] text-[rgba(255,255,255,0.45)]">
                  {MONTHS[comment.month]} {comment.day}
                </span>
              </div>
              <p className="mt-[4px] text-[14px] leading-[19px]">{comment.text}</p>
              <div className="mt-[6px] flex flex-row items-center gap-[14px] text-[12px] leading-none text-[rgba(255,255,255,0.6)]">
                <button
                  type="button"
                  aria-pressed={isLiked}
                  onClick={() => setLiked((prev) => ({ ...prev, [comment.handle]: !isLiked }))}
                  className={cn("flex flex-row items-center gap-[4px]", isLiked && "text-[rgb(255,168,168)]")}
                >
                  <ThumbsUp size={14} aria-hidden="true" />
                  <span>{comment.likes + (isLiked ? 1 : 0)}</span>
                </button>
                <button type="button" className="flex flex-row items-center gap-[4px]" aria-label="Dislike">
                  <ThumbsDown size={14} aria-hidden="true" />
                  <span>0</span>
                </button>
                <button type="button" aria-label="Reply">
                  <Reply size={14} aria-hidden="true" />
                </button>
                <button type="button" aria-label="Report">
                  <Flag size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        );
      })}

      <button
        type="button"
        className="mx-auto mt-[16px] flex h-[34px] items-center justify-center rounded-[17px] bg-[rgba(255,255,255,0.08)] px-[16px] text-[13px] leading-none"
      >
        Load more comments
      </button>
    </section>
  );
}
