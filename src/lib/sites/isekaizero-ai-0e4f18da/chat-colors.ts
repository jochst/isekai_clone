import type { CSSProperties } from "react";

import type {
  ChatColorKey,
  ChatColors,
  DefaultChatSettings,
  FontSize,
} from "@/components/sites/isekaizero-ai-0e4f18da/settings/use-default-chat-settings";

/** Chat colors (chatSettings.ui.textColor.*), in the order the site lists them. */
export const CHAT_COLOR_LABELS: { key: ChatColorKey; label: string }[] = [
  { key: "narration", label: "Narration" },
  { key: "dialogue", label: "Dialogue" },
  { key: "thoughts", label: "Thoughts (italic)" },
  { key: "bold", label: "Bold accent" },
  { key: "tracker", label: "Scene tracker" },
  { key: "tint", label: "Background tint" },
];

/** The built-in look, as hex for the colour pickers (the chat's own CSS defaults are used when a key is unset). */
export const DEFAULT_CHAT_COLORS: Record<ChatColorKey, string> = {
  narration: "#ebebeb",
  dialogue: "#ffffff",
  thoughts: "#bfbfbf",
  bold: "#ffffff",
  tracker: "#ffcf8a",
  tint: "#020920",
};

/** chatSettings.ui.textColorPreset.* */
export const CHAT_COLOR_PRESETS: {
  key: string;
  label: string;
  colors: ChatColors;
}[] = [
  { key: "classic", label: "Classic", colors: {} },
  {
    key: "ember",
    label: "Ember",
    colors: {
      narration: "#f3e3d3",
      dialogue: "#ffb36b",
      thoughts: "#d9a88a",
      bold: "#ff7a59",
      tracker: "#ffcf8a",
      tint: "#1c0b06",
    },
  },
  {
    key: "moonlight",
    label: "Moonlight",
    colors: {
      narration: "#d8e2ff",
      dialogue: "#a7c7ff",
      thoughts: "#b3b6e6",
      bold: "#c9b6ff",
      tracker: "#8fd3ff",
      tint: "#07102b",
    },
  },
  {
    key: "mono",
    label: "Monochrome",
    colors: {
      narration: "#e0e0e0",
      dialogue: "#ffffff",
      thoughts: "#a8a8a8",
      bold: "#ffffff",
      tracker: "#9e9e9e",
      tint: "#0d0d0d",
    },
  },
];

const FONT_SIZES: Record<FontSize, string> = {
  small: "14px",
  medium: "15px",
  large: "17px",
};

/** CSS variables the chat reads: text colours, background tint, message font size and backdrop opacity. */
export function chatStyleVars(ui: DefaultChatSettings["ui"]): CSSProperties {
  const vars: Record<string, string> = {
    "--iz-chat-font": FONT_SIZES[ui.fontSize] ?? FONT_SIZES.medium,
    // ponytail: the old fixed backdrop opacity (0.18) is the default 60%; 100% = 0.3 keeps text readable.
    "--iz-backdrop": String((0.3 * ui.backgroundOpacity) / 100),
  };
  for (const { key } of CHAT_COLOR_LABELS)
    if (ui.colors[key]) vars[`--iz-${key}`] = ui.colors[key];
  return vars as CSSProperties;
}
