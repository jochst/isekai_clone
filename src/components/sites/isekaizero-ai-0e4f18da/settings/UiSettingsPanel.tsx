"use client";

import { X } from "lucide-react";

import {
  CHAT_COLOR_LABELS,
  CHAT_COLOR_PRESETS,
  DEFAULT_CHAT_COLORS,
} from "@/lib/sites/isekaizero-ai-0e4f18da/chat-colors";
import { cn } from "@/lib/utils";

import {
  ResetButton,
  SegmentedControl,
  SettingCard,
  SettingRow,
  type SegmentedOption,
} from "./ui";
import {
  DEFAULT_CHAT_SETTINGS,
  useDefaultChatSettings,
  type FontSize,
} from "./use-default-chat-settings";

const FONT_SIZE_OPTIONS: readonly SegmentedOption<FontSize>[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

/** The UI/UX settings (chatSettings.ui.*): shared by Default Chat Settings and the chat's own settings. Device-wide. */
export function UiSettingsPanel() {
  const [settings, update] = useDefaultChatSettings();
  const ui = settings.ui;
  const set = (patch: Partial<typeof ui>) =>
    update({ ui: { ...ui, ...patch } });
  const presetKey = CHAT_COLOR_PRESETS.find(
    (p) => JSON.stringify(p.colors) === JSON.stringify(ui.colors),
  )?.key;

  return (
    <>
      <SettingCard>
        <div className="divide-y divide-[rgba(255,255,255,0.08)]">
          <SettingRow
            title="Send Message on Enter (Shift+Enter for New Line)"
            checked={ui.sendOnEnter}
            onChange={(sendOnEnter) => set({ sendOnEnter })}
            className="pt-0"
          />
          <SettingRow
            title="Auto Scroll to Bottom During Streaming"
            checked={ui.autoScroll}
            onChange={(autoScroll) => set({ autoScroll })}
          />
          <SettingRow
            title="Disable Fade Previous Messages During Streaming"
            checked={!ui.fadePrevious}
            onChange={(off) => set({ fadePrevious: !off })}
          />
          <SettingRow
            title="Hide Choose Your Destiny Button"
            checked={ui.hideDestiny}
            onChange={(hideDestiny) => set({ hideDestiny })}
          />
          <SettingRow
            title="Hide chat input shortcut buttons"
            checked={ui.hideShortcuts}
            onChange={(hideShortcuts) => set({ hideShortcuts })}
            className="pb-0"
          />
        </div>
      </SettingCard>

      <SettingCard title="Font Size">
        <SegmentedControl
          label="Font Size"
          options={FONT_SIZE_OPTIONS}
          value={ui.fontSize}
          onChange={(fontSize) => set({ fontSize })}
        />
      </SettingCard>

      <SettingCard title="Background Image Opacity">
        <div className="flex items-center gap-3">
          <label htmlFor="iz-bg-opacity" className="sr-only">
            Background Image Opacity
          </label>
          <input
            id="iz-bg-opacity"
            type="range"
            min={0}
            max={100}
            step={1}
            value={ui.backgroundOpacity}
            onChange={(e) => set({ backgroundOpacity: Number(e.target.value) })}
            className="h-1 w-full cursor-pointer accent-[rgb(167,185,255)]"
          />
          <span className="w-10 shrink-0 text-right text-[13px] tabular-nums text-[rgba(255,255,255,0.7)]">
            {ui.backgroundOpacity}%
          </span>
        </div>
      </SettingCard>

      <SettingCard
        title="Chat colors"
        description="Recolor the story text and the background tint. Applies to every chat on this device."
      >
        <div className="flex flex-wrap gap-2">
          {CHAT_COLOR_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => set({ colors: p.colors })}
              className={cn(
                "flex h-8 items-center gap-2 rounded-[16px] border px-3 text-[12px] font-semibold",
                presetKey === p.key
                  ? "border-[#a7b9ff] bg-[rgba(167,185,255,0.15)]"
                  : "border-white/15 bg-white/[0.05] hover:bg-white/10",
              )}
            >
              <span className="flex">
                {(["dialogue", "bold", "tint"] as const).map((k) => (
                  <span
                    key={k}
                    className="-ml-1 h-3 w-3 rounded-full border border-black/40 first:ml-0"
                    style={{
                      background: p.colors[k] ?? DEFAULT_CHAT_COLORS[k],
                    }}
                  />
                ))}
              </span>
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 divide-y divide-[rgba(255,255,255,0.08)]">
          {CHAT_COLOR_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3 py-2">
              <span className="flex-1 text-[13px] text-white/85">{label}</span>
              <input
                type="color"
                aria-label={`${label}: Custom color`}
                value={ui.colors[key] ?? DEFAULT_CHAT_COLORS[key]}
                onChange={(e) =>
                  set({ colors: { ...ui.colors, [key]: e.target.value } })
                }
                className="h-7 w-10 cursor-pointer rounded-[6px] border border-white/20 bg-transparent"
              />
              <button
                type="button"
                aria-label={`${label}: Use the default color`}
                title="Use the default color"
                disabled={!ui.colors[key]}
                onClick={() =>
                  set({
                    colors: Object.fromEntries(
                      Object.entries(ui.colors).filter(([k]) => k !== key),
                    ),
                  })
                }
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white disabled:invisible"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <ResetButton onClick={() => set({ colors: {} })}>
            Reset colors
          </ResetButton>
          <ResetButton onClick={() => update({ ui: DEFAULT_CHAT_SETTINGS.ui })}>
            Reset to Defaults
          </ResetButton>
        </div>
      </SettingCard>
    </>
  );
}
