import { DEFAULT_DM_MODEL } from "./prompt-builder";

/** Dungeon Mind model choices (NanoGPT ids, checked 2026-10-14); "off" lets the story model call the tools itself. */
export const DM_MODELS = [
  { id: DEFAULT_DM_MODEL, label: "Claude Haiku (latest) · recommended" },
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { id: "openai/gpt-5-mini", label: "GPT-5 mini" },
  { id: "off", label: "Off: the story model rolls and updates sheets itself" },
];
