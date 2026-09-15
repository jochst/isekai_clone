"use client";

import { useState } from "react";
import Link from "next/link";
import { Palette, Play, SlidersHorizontal, Wand2 } from "lucide-react";

import { LLM_CATALOG } from "@/lib/sites/isekaizero-ai-0e4f18da/catalog";
import { useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";

import { SettingsShell, type SettingsTab } from "./SettingsShell";
import { AccordionCard, InfoNote, SegmentedControl, SettingCard, SettingRow, type SegmentedOption } from "./ui";
import {
  useDefaultChatSettings,
  type ContinueBehavior,
  type FontSize,
  type Perspective,
  type ResponseLength,
  type TemperatureLevel,
} from "./use-default-chat-settings";

type TabKey = "overview" | "adaptation" | "ui";

const TABS: readonly SettingsTab<TabKey>[] = [
  { key: "overview", label: "Overview", icon: SlidersHorizontal },
  { key: "adaptation", label: "Adaptation", icon: Wand2 },
  { key: "ui", label: "UI/UX", icon: Palette },
];

const RESPONSE_LENGTH_OPTIONS: readonly SegmentedOption<ResponseLength>[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

const TEMPERATURE_OPTIONS: readonly SegmentedOption<TemperatureLevel>[] = [
  { value: "low", label: "Low" },
  { value: "mid", label: "Mid" },
  { value: "high", label: "High" },
  { value: "max", label: "Max" },
];

const REASONING_OPTIONS: readonly SegmentedOption<"off" | "on">[] = [
  { value: "off", label: "Off" },
  { value: "on", label: "On" },
];

const PERSPECTIVE_OPTIONS: readonly SegmentedOption<Perspective>[] = [
  { value: "none", label: "None" },
  { value: "1st", label: "1st Person" },
  { value: "2nd", label: "2nd Person" },
  { value: "3rd", label: "3rd Person" },
];

const CONTINUE_OPTIONS: readonly SegmentedOption<ContinueBehavior>[] = [
  { value: "control", label: "Control" },
  { value: "dont-control", label: "Don't Control" },
];

const FONT_SIZE_OPTIONS: readonly SegmentedOption<FontSize>[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const AUTO_TITLE = "Auto (recommended)";
const AUTO_DESCRIPTION = "The model new chats start with. Auto picks the current recommended model.";

/** Body of `/default-chat-settings` (rendered under the page's PageHeader). */
export function DefaultChatSettingsPage() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [settings, update, reset] = useDefaultChatSettings();
  const [provider, updateProvider] = useProviderSettings();

  const selectedModel = settings.modelId === "auto" ? undefined : LLM_CATALOG.find((m) => m.id === settings.modelId);
  const modelTitle = selectedModel?.name ?? AUTO_TITLE;
  const modelDescription = selectedModel?.description || AUTO_DESCRIPTION;

  return (
    <SettingsShell
      intro="Set your preferred settings once, every new chat you start will use them."
      onReset={reset}
      override={{
        title: "Override creator settings",
        description:
          "Use your defaults even when a story's creator recommends their own settings or AI model. Story requirements still apply.",
        checked: settings.overrideCreator,
        onChange: (overrideCreator) => update({ overrideCreator }),
      }}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" ? (
        <>
          <Link
            href="/default-chat-settings/llms"
            className="iz-border-model mb-3 block rounded-[12px] p-[2px] text-white"
          >
            <span className="iz-model-card flex items-center rounded-[10px] p-4">
              <span className="iz-border-model flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[50px] p-[2px]">
                <span className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white text-[rgb(40,75,207)]">
                  <Wand2 size={30} strokeWidth={2} aria-hidden />
                </span>
              </span>
              <span className="ml-3 min-w-0 flex-1">
                <span className="block truncate text-[16px] font-bold leading-5">{modelTitle}</span>
                <span className="mt-1 block text-[13px] leading-[18px] text-[rgba(255,255,255,0.7)]">{modelDescription}</span>
              </span>
              <Play size={20} strokeWidth={0} aria-hidden className="ml-3 shrink-0 fill-white text-white" />
            </span>
          </Link>

          <InfoNote>
            On Auto, new chats follow the recommended model and its own default settings. Select a default AI model to
            customize your default chat settings.
          </InfoNote>

          <AccordionCard title="Custom Prompts">
            <label htmlFor="iz-custom-prompt" className="sr-only">
              System prompt additions
            </label>
            <textarea
              id="iz-custom-prompt"
              value={settings.customPrompt}
              onChange={(e) => update({ customPrompt: e.target.value })}
              placeholder="System prompt additions"
              spellCheck={false}
              className="mt-3 block min-h-[120px] w-full resize-y rounded-[12px] border border-[rgba(167,185,255,0.5)] bg-[rgb(47,51,80)] p-3 text-[14px] leading-5 text-white outline-none placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgb(167,185,255)]"
            />
          </AccordionCard>

          <AccordionCard title="Functions">
            <div className="mt-1 divide-y divide-[rgba(255,255,255,0.08)]">
              <SettingRow
                title="DM Enabled"
                description="Let the AI act as a dungeon master and roll for outcomes"
                checked={settings.functions.dmEnabled}
                onChange={(dmEnabled) => update({ functions: { ...settings.functions, dmEnabled } })}
              />
              <SettingRow
                title="AI Media Picker"
                description="Let AI choose the appropriate chat background image for you"
                checked={settings.functions.mediaPicker}
                onChange={(mediaPicker) => update({ functions: { ...settings.functions, mediaPicker } })}
              />
              <SettingRow
                title="Story Soundtrack"
                description="Load the storyline's soundtrack and let the AI play music matching each scene"
                checked={settings.functions.storyMusic}
                onChange={(storyMusic) => update({ functions: { ...settings.functions, storyMusic } })}
              />
              <SettingRow
                title="Auto Illustrate"
                description="Automatically generate scene images when new messages arrive"
                checked={provider.autoIllustrate}
                onChange={(autoIllustrate) => updateProvider({ autoIllustrate })}
                className="pb-0"
              />
            </div>
          </AccordionCard>
        </>
      ) : null}

      {tab === "adaptation" ? (
        <>
          <SettingCard title="Response Length" description="Sets the response length for AI responses">
            <SegmentedControl
              label="Response Length"
              options={RESPONSE_LENGTH_OPTIONS}
              value={settings.responseLength}
              onChange={(responseLength) => update({ responseLength })}
            />
          </SettingCard>

          <SettingCard title="Temperature" description="Controls AI creativity. Low = focused, High = creative">
            <SegmentedControl
              label="Temperature"
              options={TEMPERATURE_OPTIONS}
              value={settings.temperature}
              onChange={(temperature) => update({ temperature })}
            />
            {settings.temperature === "max" ? (
              <p className="mt-2 text-[11px] leading-[15px] text-[rgb(255,168,168)]">
                Too high temperature may create instability in responses
              </p>
            ) : null}
          </SettingCard>

          <SettingCard
            title="Reasoning"
            description="Squeeze more intelligence out of the model, but it will increase output token cost"
          >
            <SegmentedControl
              label="Reasoning"
              options={REASONING_OPTIONS}
              value={settings.reasoning ? "on" : "off"}
              onChange={(v) => update({ reasoning: v === "on" })}
            />
          </SettingCard>

          <SettingCard title="Perspective" description="Set the narrative perspective for AI responses">
            <SegmentedControl
              label="Perspective"
              options={PERSPECTIVE_OPTIONS}
              value={settings.perspective}
              onChange={(perspective) => update({ perspective })}
            />
          </SettingCard>

          <SettingCard
            title="Continue Behavior"
            description="Allow AI to write for and control your character during continue"
          >
            <SegmentedControl
              label="Continue Behavior"
              options={CONTINUE_OPTIONS}
              value={settings.continueBehavior}
              onChange={(continueBehavior) => update({ continueBehavior })}
            />
          </SettingCard>
        </>
      ) : null}

      {tab === "ui" ? (
        <>
          <SettingCard>
            <div className="divide-y divide-[rgba(255,255,255,0.08)]">
              <SettingRow
                title="Send Message on Enter (Shift+Enter for New Line)"
                checked={settings.ui.sendOnEnter}
                onChange={(sendOnEnter) => update({ ui: { ...settings.ui, sendOnEnter } })}
                className="pt-0"
              />
              <SettingRow
                title="Auto Scroll to Bottom During Streaming"
                checked={settings.ui.autoScroll}
                onChange={(autoScroll) => update({ ui: { ...settings.ui, autoScroll } })}
              />
              <SettingRow
                title="Always Auto Expand Thinking"
                checked={settings.ui.autoExpandThinking}
                onChange={(autoExpandThinking) => update({ ui: { ...settings.ui, autoExpandThinking } })}
              />
              <SettingRow
                title="Parallax Effect"
                checked={settings.ui.parallax}
                onChange={(parallax) => update({ ui: { ...settings.ui, parallax } })}
              />
              <SettingRow
                title="Hide Choose Your Destiny Button"
                checked={settings.ui.hideDestiny}
                onChange={(hideDestiny) => update({ ui: { ...settings.ui, hideDestiny } })}
                className="pb-0"
              />
            </div>
          </SettingCard>

          <SettingCard title="Font Size">
            <SegmentedControl
              label="Font Size"
              options={FONT_SIZE_OPTIONS}
              value={settings.ui.fontSize}
              onChange={(fontSize) => update({ ui: { ...settings.ui, fontSize } })}
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
                value={settings.ui.backgroundOpacity}
                onChange={(e) => update({ ui: { ...settings.ui, backgroundOpacity: Number(e.target.value) } })}
                className="h-1 w-full cursor-pointer accent-[rgb(167,185,255)]"
              />
              <span className="w-10 shrink-0 text-right text-[13px] tabular-nums text-[rgba(255,255,255,0.7)]">
                {settings.ui.backgroundOpacity}%
              </span>
            </div>
          </SettingCard>
        </>
      ) : null}
    </SettingsShell>
  );
}
