"use client";

import { ChevronRight, Play, Wand2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ImageModelPicker } from "@/components/sites/isekaizero-ai-0e4f18da/image-generation/ImageModelPicker";
import { useProviderCatalog } from "@/components/sites/isekaizero-ai-0e4f18da/image-generation/use-provider-catalog";
import { VideoModelPicker } from "@/components/sites/isekaizero-ai-0e4f18da/video-generation/VideoModelPicker";
import { VideoParamsForm, paramSummary } from "@/components/sites/isekaizero-ai-0e4f18da/video-generation/VideoParamsForm";
import { resolveImageModel, resolveVideoModel, type ContextReport, type ResolvedTextModel } from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { VIDEO_UNSUPPORTED_REASON, effectiveVideoParams } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { ChatSession, ChatSettings, ProviderSettings, ReasoningEffort, VideoParamValue } from "@/types/isekaizero";

import { cn } from "@/lib/utils";
import { AccordionCard, SegmentedControl, SettingRow, SideSheet, Toggle } from "./primitives";

/** "Off" uses the model's own window; smaller limits trim older messages sooner and cost less per turn. */
const CONTEXT_OVERRIDE_OPTIONS = [
  { value: "0", label: "Model" },
  { value: "16000", label: "16k" },
  { value: "32000", label: "32k" },
  { value: "64000", label: "64k" },
  { value: "128000", label: "128k" },
];

const REASONING_EFFORT_OPTIONS: { value: ReasoningEffort; label: string }[] = [
  { value: "minimal", label: "Min" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Mid" },
  { value: "high", label: "High" },
  { value: "max", label: "Max" },
];

export interface ChatSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  session: ChatSession;
  provider: ProviderSettings;
  model: ResolvedTextModel;
  /** How the next request fits the context window (estimated tokens, limit, what was trimmed). */
  context: ContextReport;
  onChange: (patch: Partial<ChatSettings>) => void;
  /** Opens the Memory (chapters and arcs) panel. */
  onOpenMemory: () => void;
}

export function ChatSettingsSheet({ open, onClose, session, provider, model, context, onChange, onOpenMemory }: ChatSettingsSheetProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { settings } = session;
  const [, updateProvider] = useProviderSettings();
  const catalog = useProviderCatalog();
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const videoModel = resolveVideoModel(settings, provider, catalog.videos);
  const videoValues = useMemo<Record<string, VideoParamValue>>(
    () => effectiveVideoParams(videoModel.params ?? [], videoModel.defaults ?? {}, provider.videoParams),
    [videoModel.params, videoModel.defaults, provider.videoParams],
  );
  const imageModel = resolveImageModel(settings, provider);
  const image = {
    name: imageModel.name || "Not set",
    cost: imageModel.costPerImage !== undefined ? `${Math.round(imageModel.costPerImage * 100)}` : "provider pricing",
  };
  const fill = Math.min(100, Math.round((context.estimated / Math.max(1, context.limit)) * 100));

  return (
    <>
      <SideSheet open={open} onClose={onClose} title="Chat Settings" subtitle="Customize your chat style with response length preferences">
        <Link href={`/chats/${session.id}/llms`} className="iz-border-model block rounded-[12px] p-[2px] transition-[filter] duration-150 hover:brightness-[1.06]">
          <span className="iz-model-card flex items-center rounded-[10px] p-4">
            <span className="iz-border-model flex h-[54px] w-[54px] shrink-0 rounded-[50px] p-[2px]">
              <span className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white text-[#284bcf]">
                <Wand2 size={30} />
              </span>
            </span>
            <span className="ml-3 min-w-0 flex-1">
              <span className="block truncate text-[16px] font-bold">{model.auto ? "Auto (recommended)" : model.name}</span>
              <span className="iz-line-clamp-2 mt-1 block text-[13px] leading-[18px] text-white/70">{model.description}</span>
            </span>
            <Play size={20} className="ml-3 shrink-0" />
          </span>
        </Link>

        <div className="mt-3 rounded-[12px] bg-white/5 p-3 text-[13px]">
          <div className="flex items-center justify-between">
            <span>Estimated Context</span>
            <span className="text-white/70">≈ {context.estimated.toLocaleString("en-US")} tokens</span>
          </div>
          <div className="mt-2 h-1 rounded-[2px] bg-white/15">
            <div className={cn("h-1 rounded-[2px] transition-[width] duration-300", fill >= 90 ? "bg-[#ffb4ab]" : "bg-[#a7b9ff]")} style={{ width: `${fill}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-white/45">
            <span>Context Limit</span>
            <span>
              {context.limit.toLocaleString("en-US")}
              {settings.contextLimitOverride ? " (override)" : ""}
            </span>
          </div>
          {context.trimmedMessages > 0 ? <div className="mt-1 text-[11px] text-[#ffb4ab]">Messages: {context.trimmedMessages}/{context.totalMessages} trimmed</div> : null}
          {context.trimmedChapters > 0 ? <div className="mt-1 text-[11px] text-[#ffb4ab]">Chapters: {context.trimmedChapters}/{context.totalChapters} trimmed</div> : null}
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <AccordionCard title="Response Length" description="Sets the response length for AI responses" defaultOpen>
            <SegmentedControl
              label="Response Length"
              value={settings.responseLength}
              onChange={(responseLength) => onChange({ responseLength })}
              options={[
                { value: "short", label: "Short" },
                { value: "medium", label: "Medium" },
                { value: "long", label: "Long" },
              ]}
            />
          </AccordionCard>

          <AccordionCard title="Temperature" description="Controls AI creativity. Low = focused, High = creative">
            <SegmentedControl
              label="Temperature"
              value={settings.temperature}
              onChange={(temperature) => onChange({ temperature })}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Mid" },
                { value: "high", label: "High" },
                { value: "max", label: "Max" },
              ]}
            />
          </AccordionCard>

          <AccordionCard title="Context Limit Override" description="Set a context limit to save cost and manage token usage">
            <SegmentedControl
              label="Context Limit Override"
              value={String(settings.contextLimitOverride ?? 0)}
              onChange={(v) => onChange({ contextLimitOverride: Number(v) || undefined })}
              options={CONTEXT_OVERRIDE_OPTIONS}
            />
          </AccordionCard>

          <AccordionCard title="Response Token Limit" description="Sets the maximum token limit for AI responses">
            <SegmentedControl
              label="Response Token Limit"
              value={settings.responseTokenLimit ?? "capped"}
              onChange={(responseTokenLimit) => onChange({ responseTokenLimit })}
              options={[
                { value: "capped", label: "Capped" },
                { value: "high", label: "High" },
                { value: "max", label: "Max" },
              ]}
            />
            {settings.responseTokenLimit === "max" ? <p className="mt-2 text-[11px] leading-[15px] text-[rgb(255,168,168)]">This will prevent truncation but it will not stop the model from over yapping</p> : null}
          </AccordionCard>

          <AccordionCard title="Reasoning" description="Squeeze more intelligence out of the model, but it will increase output token cost">
            <SegmentedControl
              label="Reasoning"
              value={settings.reasoning ? "on" : "off"}
              onChange={(v) => onChange({ reasoning: v === "on" })}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
            {settings.reasoning ? (
              <div className="mt-3">
                <p className="mb-2 text-[12px] leading-4 text-white/60">Reasoning Effort: controls how much effort the model puts into reasoning</p>
                <SegmentedControl
                  label="Reasoning Effort"
                  value={settings.reasoningEffort ?? "medium"}
                  onChange={(reasoningEffort) => onChange({ reasoningEffort })}
                  options={REASONING_EFFORT_OPTIONS}
                />
              </div>
            ) : null}
          </AccordionCard>

          <AccordionCard title="Perspective" description="Set the narrative perspective for AI responses">
            <SegmentedControl
              label="Perspective"
              value={settings.perspective}
              onChange={(perspective) => onChange({ perspective })}
              options={[
                { value: "1st", label: "1st" },
                { value: "2nd", label: "2nd" },
                { value: "3rd", label: "3rd" },
              ]}
            />
          </AccordionCard>

          <AccordionCard title="Scene Images" description="Illustrate the story as it unfolds">
            <SettingRow
              title="Auto Play on New Messages"
              description="Automatically generate scene images when new messages arrive"
              right={<Toggle checked={settings.autoIllustrate} onChange={(autoIllustrate) => onChange({ autoIllustrate })} label="Auto Play on New Messages" />}
            />
            <SettingRow
              title="Auto-Generate Characters"
              description="Automatically generate portraits when new characters enter the scene"
              right={<Toggle checked={Boolean(settings.autoCreateCharacter)} onChange={(autoCreateCharacter) => onChange({ autoCreateCharacter })} label="Auto-Generate Characters" />}
            />
            <SettingRow
              title="Auto-Create Appearances"
              description="Automatically create new looks when character outfits or appearances change"
              right={<Toggle checked={Boolean(settings.autoEditCharacter)} onChange={(autoEditCharacter) => onChange({ autoEditCharacter })} label="Auto-Create Appearances" />}
            />
            <button type="button" onClick={() => setPickerOpen(true)} className="flex h-[49px] w-full items-center justify-between gap-3 text-left">
              <span className="min-w-0">
                <span className="block text-[18px] font-semibold">Image Model</span>
                <span className="block text-[14px] text-white/50">Select AI model for generation</span>
              </span>
              <span className="flex min-w-0 items-center gap-1">
                <span className="min-w-0 text-right">
                  <span className="block truncate text-[16px] text-[#a0a0a0]">{image.name}</span>
                  {settings.illustrationModel === "default" ? <span className="block text-[12px] text-white/40">Provider default</span> : null}
                </span>
                <ChevronRight size={20} className="shrink-0" />
              </span>
            </button>
            <div className="mt-2">
              <SegmentedControl
                label="Illustration perspective"
                value={settings.illustrationPerspective === "pov" || settings.imageGenPerspective === "pov" ? "pov" : "third"}
                onChange={(p) => onChange({ illustrationPerspective: p, imageGenPerspective: p === "pov" ? "pov" : "3rd-person" })}
                options={[
                  { value: "pov", label: "POV" },
                  { value: "third", label: "3rd Person" },
                ]}
              />
              <p className="mt-2 text-[12px] text-white/55">
                {(settings.illustrationPerspective === "pov" || settings.imageGenPerspective === "pov")
                  ? "See the scene through your character's eyes"
                  : "View the scene from an outside perspective"}
              </p>
            </div>
            <div className="mt-3">
              <label className="block text-[13px] font-semibold text-white/80">Default Instructions</label>
              <p className="mt-0.5 text-[11px] text-white/50">
                Optional guidance applied every time scene or character illustration runs in this chat.
              </p>
              <textarea
                value={settings.lightNovelPromptInstructions ?? ""}
                onChange={(e) => onChange({ lightNovelPromptInstructions: e.target.value })}
                placeholder="e.g. Makoto Shinkai style, cinematic lighting, 8k anime art, highly detailed"
                spellCheck={false}
                rows={3}
                className="mt-2 block w-full resize-y rounded-[10px] border border-white/15 bg-white/[0.06] p-2.5 text-[13px] leading-5 text-white outline-none placeholder:text-white/30 focus:border-[#a7b9ff]"
              />
            </div>
            <p className="mt-3 text-[12px] text-white/55">Mana/Arcane Per Image: {image.cost}</p>
            <p className="mt-1 text-[11px] leading-4 text-[#ffa8a8]">
              This feature is in Alpha, expect bugs and issues. Generation may consume Arcane without producing results.
            </p>
          </AccordionCard>

          <AccordionCard title="Scene Videos" description="Animate scene images with a video model">
            <button type="button" onClick={() => setVideoPickerOpen(true)} className="flex h-[49px] w-full items-center justify-between gap-3 text-left">
              <span className="min-w-0">
                <span className="block text-[18px] font-semibold">Video Model</span>
                <span className="block text-[14px] text-white/50">Used by Animate</span>
              </span>
              <span className="flex min-w-0 items-center gap-1">
                <span className="min-w-0 text-right">
                  <span className="block truncate text-[16px] text-[#a0a0a0]">{videoModel.name}</span>
                  {settings.animationModel === "default" ? <span className="block text-[12px] text-white/40">Provider default</span> : null}
                </span>
                <ChevronRight size={20} className="shrink-0" />
              </span>
            </button>
            {catalog.status === "ready" && !catalog.videoSupported ? (
              <p className="mt-1 text-[12px] leading-4 text-[#ffb4ab]">{catalog.videoReason ?? VIDEO_UNSUPPORTED_REASON}</p>
            ) : null}
            {videoModel.params ? (
              <>
                <p className="mt-2 text-[12px] text-white/55">{paramSummary(videoModel.params, videoValues) || "Model defaults"}</p>
                <VideoParamsForm
                  className="mt-1"
                  specs={videoModel.params}
                  values={videoValues}
                  defaults={videoModel.defaults ?? {}}
                  onChange={(videoParams) => updateProvider({ videoParams })}
                />
              </>
            ) : null}
            <p className="mt-3 text-[12px] text-white/55">Price: {videoModel.priceSummary ?? "provider pricing"}</p>
            <p className="mt-1 text-[11px] leading-4 text-[#ffa8a8]">
              This feature is in Alpha, expect bugs and issues. Generation may consume Arcane without producing results.
            </p>
          </AccordionCard>

          <AccordionCard title="Memory" description="Chapters and arcs">
            <p className="text-[13px] leading-[18px] text-white/70">Condense your story into chapters and arcs to save tokens while keeping continuity</p>
            <button
              type="button"
              onClick={onOpenMemory}
              className="mt-3 h-10 w-full rounded-[20px] border border-white/15 bg-white/[0.06] text-[13px] font-semibold text-white/80 hover:bg-white/10"
            >
              Open Memory
            </button>
          </AccordionCard>
        </div>
      </SideSheet>

      <ImageModelPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        value={settings.illustrationModel === "default" ? provider.imageModel : settings.illustrationModel}
        onSelect={(m) => onChange({ illustrationModel: m.id })}
      />

      <VideoModelPicker
        open={videoPickerOpen}
        onClose={() => setVideoPickerOpen(false)}
        value={videoModel.id}
        onSelect={(m) => {
          onChange({ animationModel: m.id });
          updateProvider(provider.videoModel ? { videoParams: m.defaults } : { videoModel: m.id, videoParams: m.defaults });
        }}
      />
    </>
  );
}
