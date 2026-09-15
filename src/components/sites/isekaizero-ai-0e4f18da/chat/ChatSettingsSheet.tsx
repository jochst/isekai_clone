"use client";

import { ChevronRight, Play, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ImageModelPicker } from "@/components/sites/isekaizero-ai-0e4f18da/image-generation/ImageModelPicker";
import { resolveImageModel, type ResolvedTextModel } from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import type { ChatSession, ChatSettings, ProviderSettings } from "@/types/isekaizero";

import { AccordionCard, SegmentedControl, SettingRow, SideSheet, Toggle } from "./primitives";

export interface ChatSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  session: ChatSession;
  provider: ProviderSettings;
  model: ResolvedTextModel;
  tokenEstimate: number;
  onChange: (patch: Partial<ChatSettings>) => void;
  onToast: (message: string) => void;
}

export function ChatSettingsSheet({ open, onClose, session, provider, model, tokenEstimate, onChange, onToast }: ChatSettingsSheetProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { settings } = session;
  const imageModel = resolveImageModel(settings, provider);
  const image = {
    name: imageModel.name || "Not set",
    cost: imageModel.costPerImage !== undefined ? `${Math.round(imageModel.costPerImage * 100)}` : "provider pricing",
  };
  const fill = Math.min(100, Math.round((tokenEstimate / Math.max(1, model.contextLimit)) * 100));

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
            <span>Context</span>
            <span className="text-white/70">≈ {tokenEstimate.toLocaleString("en-US")} tokens</span>
          </div>
          <div className="mt-2 h-1 rounded-[2px] bg-white/15">
            <div className="h-1 rounded-[2px] bg-[#a7b9ff] transition-[width] duration-300" style={{ width: `${fill}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-white/45">{model.contextLimit.toLocaleString("en-US")} token limit</div>
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
                value={settings.illustrationPerspective}
                onChange={(illustrationPerspective) => onChange({ illustrationPerspective })}
                options={[
                  { value: "pov", label: "POV" },
                  { value: "third", label: "3rd Person" },
                ]}
              />
              <p className="mt-2 text-[12px] text-white/55">
                {settings.illustrationPerspective === "pov" ? "See the scene through your character's eyes" : "View the scene from an outside perspective"}
              </p>
            </div>
            <p className="mt-3 text-[12px] text-white/55">Mana/Arcane Per Image: {image.cost}</p>
            <p className="mt-1 text-[11px] leading-4 text-[#ffa8a8]">
              This feature is in Alpha, expect bugs and issues. Generation may consume Arcane without producing results.
            </p>
          </AccordionCard>

          <AccordionCard title="Memory" description="Chapters and arcs">
            <p className="text-[13px] leading-[18px] text-white/70">Condense your story into chapters and arcs to save tokens while keeping continuity</p>
            <button
              type="button"
              onClick={() => onToast("Chapter summaries are not part of this demo")}
              className="mt-3 h-10 w-full rounded-[20px] border border-white/15 bg-white/[0.06] text-[13px] font-semibold text-white/60"
            >
              Summarize chapter
            </button>
          </AccordionCard>
        </div>
      </SideSheet>

      <ImageModelPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        value={settings.illustrationModel === "default" ? provider.imageModel : settings.illustrationModel}
        onSelect={(id) => onChange({ illustrationModel: id })}
      />
    </>
  );
}
