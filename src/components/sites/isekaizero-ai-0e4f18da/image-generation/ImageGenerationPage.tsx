"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Check, ChevronRight, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";

import { IMAGE_CATALOG } from "@/lib/sites/isekaizero-ai-0e4f18da/catalog";
import { PROVIDER_PRESETS, providerHeaders, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import { cn } from "@/lib/utils";
import type { ImageSizePreset } from "@/types/isekaizero";

import { PageHeader } from "../shared/PageHeader";
import { BottomSheet, CrystalPair, ImageModelPicker, formatManaCost } from "./ImageModelPicker";
import { PROVIDER_NOT_CONFIGURED_ERROR, useImageGeneration, type GeneratedImage } from "./use-image-generation";

const IMG = "/sites/isekaizero-ai-0e4f18da/shared/images";
const PROMPT_MAX = 3000;

/** Fallback size list used when the selected model has no catalog presets. */
export const DEFAULT_SIZE_PRESETS: ImageSizePreset[] = [
  { key: "3:4", label: "Portrait Standard", width: 896, height: 1152, aspectRatio: "3:4", orientation: "portrait" },
  { key: "1:1", label: "Square", width: 1024, height: 1024, aspectRatio: "1:1", orientation: "square" },
  { key: "9:16", label: "Portrait", width: 768, height: 1344, aspectRatio: "9:16", orientation: "portrait" },
  { key: "4:3", label: "Standard", width: 1152, height: 896, aspectRatio: "4:3", orientation: "landscape" },
  { key: "3:2", label: "Photo", width: 1024, height: 640, aspectRatio: "3:2", orientation: "landscape" },
  { key: "2:3", label: "Portrait Photo", width: 640, height: 1024, aspectRatio: "2:3", orientation: "portrait" },
  { key: "21:9", label: "Ultra Wide", width: 1536, height: 640, aspectRatio: "21:9", orientation: "landscape" },
  { key: "16:9", label: "Landscape", width: 1344, height: 768, aspectRatio: "16:9", orientation: "landscape" },
  { key: "9:21", label: "Ultra Tall", width: 640, height: 1536, aspectRatio: "9:21", orientation: "portrait" },
];

export type CompositionType = "Foreground" | "Background" | "Full Scene";

const COMPOSITION_OPTIONS: { value: CompositionType; hint: string; description: string }[] = [
  { value: "Foreground", hint: "foreground character focus, subject fills the frame", description: "Character or subject in front, minimal backdrop" },
  { value: "Background", hint: "background environment only, no characters", description: "Scenery and environment without characters" },
  { value: "Full Scene", hint: "full scene with characters placed in a detailed environment", description: "Characters and environment together" },
];

const ENHANCE_SYSTEM_PROMPT =
  "You rewrite short image ideas into detailed anime illustration prompts for a text-to-image model. " +
  "Describe subject, pose, expression, outfit, lighting, environment and art style. " +
  "Reply with the prompt only — no preamble, no quotes, at most 80 words.";

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */

interface SelectRowProps {
  title: string;
  sub: string;
  required?: boolean;
  value: string;
  valueSub?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

function SelectRow({ title, sub, required, value, valueSub, onClick, className }: SelectRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex h-[49px] w-full cursor-pointer items-center justify-between text-left", className)}
    >
      <div className="mr-3 flex min-w-0 flex-1 flex-col">
        <div className="mb-1 text-[18px] font-semibold leading-[22px] text-white">
          {title}
          {required ? <span className="text-[rgb(255,87,71)]"> *</span> : null}
        </div>
        <div className="mt-[2px] text-[14px] leading-[17px] text-[rgba(255,255,255,0.5)]">{sub}</div>
      </div>
      <div className="flex max-w-[50%] items-center gap-2">
        <div className="flex min-w-0 flex-col items-end">
          <div className="max-w-full truncate whitespace-nowrap text-[16px] leading-5 text-[rgb(160,160,160)]">{value}</div>
          {valueSub ? (
            <div className="mt-[6px] flex items-center gap-1 whitespace-nowrap text-[12px] leading-[14px] text-[rgba(255,255,255,0.4)]">
              {valueSub}
            </div>
          ) : null}
        </div>
        <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-white" aria-hidden />
      </div>
    </button>
  );
}

interface CheckboxRowProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  sub: string;
  className?: string;
}

function CheckboxRow({ checked, onChange, title, sub, className }: CheckboxRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("flex h-11 w-full cursor-pointer items-center gap-3 text-left", className)}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors",
          checked ? "border-[rgb(167,185,255)] bg-[rgb(42,65,228)]" : "border-[rgba(167,185,255,0.5)] bg-[rgb(47,51,80)]",
        )}
      >
        {checked ? <Check size={16} strokeWidth={3} className="text-white" aria-hidden /> : null}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="mb-1 text-[16px] font-medium leading-5 text-white">{title}</span>
        <span className="text-[14px] leading-[17px] text-[rgba(255,255,255,0.5)]">{sub}</span>
      </span>
    </button>
  );
}

interface SheetOption {
  key: string;
  label: string;
  description: string;
}

function OptionSheet({
  open,
  onClose,
  title,
  options,
  value,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  options: SheetOption[];
  value: string;
  onPick: (key: string) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-1">
        {options.map((o) => {
          const selected = o.key === value;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onPick(o.key);
                onClose();
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-[12px] border p-3 text-left transition-colors",
                selected ? "border-[rgba(167,185,255,0.6)] bg-[rgba(42,65,228,0.25)]" : "border-transparent hover:bg-[rgba(255,255,255,0.06)]",
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-semibold leading-5 text-white">{o.label}</span>
                <span className="mt-[2px] text-[12px] leading-4 text-[rgba(255,255,255,0.6)]">{o.description}</span>
              </span>
              {selected ? <Check size={18} strokeWidth={2.5} className="shrink-0 text-white" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export interface ImageGenerationPageProps {
  /** Render the 64px "← Image Generation" header above the two-column body (default true). */
  showHeader?: boolean;
  className?: string;
}

/** Standalone image generation tool (`/creation/generate-image`): form on the left, preview + history on the right. */
export function ImageGenerationPage({ showHeader = true, className }: ImageGenerationPageProps) {
  const [settings, updateSettings, hydrated] = useProviderSettings();
  const { generate, generating, result, error, history, select, clearError } = useImageGeneration(settings);

  const [prompt, setPrompt] = useState("");
  const [picked, setPicked] = useState<{ id: string; name: string; cost?: number } | null>(null);
  const [aspectKey, setAspectKey] = useState<string>(DEFAULT_SIZE_PRESETS[0].key);
  const [composition, setComposition] = useState<CompositionType>("Foreground");
  const [autoRemoveBg, setAutoRemoveBg] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"model" | "aspect" | "composition" | null>(null);

  const configured = Boolean(settings.baseUrl && settings.apiKey);
  const presetLabel = PROVIDER_PRESETS.find((p) => p.id === settings.preset)?.label ?? "Provider";

  const catalogModel = useMemo(
    () => IMAGE_CATALOG.find((m) => m.model === settings.imageModel || m.id === settings.imageModel),
    [settings.imageModel],
  );
  const pickedMatches = picked !== null && picked.id === settings.imageModel;
  const modelName = catalogModel?.name ?? (pickedMatches ? picked.name : settings.imageModel || "Select a model");
  const modelCost = catalogModel?.costPerImage ?? (pickedMatches ? picked.cost : undefined);
  const isPlatformModel = catalogModel !== undefined;

  const presets = catalogModel && catalogModel.presets.length > 0 ? catalogModel.presets : DEFAULT_SIZE_PRESETS;
  const preset = presets.find((p) => p.key === aspectKey) ?? presets[0];
  const size = `${preset.width}x${preset.height}`;

  const compositionMeta = COMPOSITION_OPTIONS.find((c) => c.value === composition) ?? COMPOSITION_OPTIONS[0];

  const onSelectModel = useCallback(
    (id: string, name: string, costPerImage?: number) => {
      setPicked({ id, name, cost: costPerImage });
      updateSettings({ imageModel: id });
    },
    [updateSettings],
  );

  const buildPrompt = () => {
    const hints = [compositionMeta.hint];
    if (autoRemoveBg) hints.push("isolated on a plain solid background for clean background removal");
    return `${prompt.trim()}. ${hints.join(", ")}.`;
  };

  const onGenerate = async () => {
    setEnhanceError(null);
    await generate({ model: settings.imageModel, prompt: buildPrompt(), size });
  };

  const onEnhance = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhanceError(null);
    clearError();
    if (!configured) {
      setEnhanceError(PROVIDER_NOT_CONFIGURED_ERROR);
      return;
    }
    if (!settings.textModel) {
      setEnhanceError("No text model selected. Pick one in Settings → Providers.");
      return;
    }
    setEnhancing(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...providerHeaders(settings) },
        body: JSON.stringify({
          model: settings.textModel,
          stream: false,
          temperature: 0.7,
          max_tokens: 220,
          messages: [
            { role: "system", content: ENHANCE_SYSTEM_PROMPT },
            { role: "user", content: prompt.trim() },
          ],
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        choices?: { message?: { content?: string } }[];
      };
      if (!res.ok || json.error) {
        setEnhanceError(json.error || `Enhance failed (${res.status})`);
        return;
      }
      const text = json.choices?.[0]?.message?.content?.trim().replace(/^["'“”]+|["'“”]+$/g, "");
      if (!text) {
        setEnhanceError("The text model returned an empty prompt.");
        return;
      }
      setPrompt(text.slice(0, PROMPT_MAX));
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown error";
      setEnhanceError(`Could not reach the server: ${message}`);
    } finally {
      setEnhancing(false);
    }
  };

  const canGenerate = prompt.trim().length > 0 && !generating;
  const notice = enhanceError ?? error;
  const showConnectNotice = (hydrated && !configured) || notice === PROVIDER_NOT_CONFIGURED_ERROR;

  return (
    <div className={cn("flex min-h-screen flex-col text-white", className)}>
      {showHeader ? <PageHeader title="Image Generation" /> : null}

      <div className="flex flex-1 flex-col min-[900px]:h-[calc(100vh-64px)] min-[900px]:flex-row">
        {/* ---------------- Left form ---------------- */}
        <div className="flex w-full shrink-0 flex-col px-5 pb-8 pt-5 min-[900px]:w-[459px] min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[rgba(255,255,255,0.06)]">
          <SelectRow
            title="Model"
            sub="Select AI model for generation"
            required
            value={modelName}
            valueSub={
              modelCost !== undefined ? (
                <>
                  <CrystalPair />
                  <span>{formatManaCost(modelCost)}</span>
                </>
              ) : (
                <span>{presetLabel}</span>
              )
            }
            onClick={() => setSheet("model")}
          />
          {isPlatformModel ? (
            <p className="mt-1 text-[12px] leading-4 text-[rgba(255,255,255,0.4)]">Platform models require a provider that serves this id.</p>
          ) : null}

          <div className="my-6 flex flex-col">
            <label htmlFor="iz-image-prompt" className="text-[18px] font-semibold leading-[22px] text-white">
              Prompt<span className="text-[rgb(255,87,71)]"> *</span>
            </label>
            <textarea
              id="iz-image-prompt"
              value={prompt}
              maxLength={PROMPT_MAX}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="mt-[5px] h-[200px] w-full resize-none rounded-[12px] border border-[rgba(167,185,255,0.5)] bg-[rgb(47,51,80)] p-4 text-[16px] leading-6 text-white outline-none placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgb(167,185,255)]"
            />
            <div className="mt-1 text-right text-[12px] leading-4 text-[rgba(255,255,255,0.4)]">
              {prompt.length} / {PROMPT_MAX}
            </div>
            <button
              type="button"
              onClick={onEnhance}
              disabled={!prompt.trim() || enhancing}
              className="mt-2 h-[51px] w-full cursor-pointer overflow-hidden rounded-[30px] bg-[linear-gradient(90deg,rgb(255,168,168),rgba(31,26,90,0),rgba(31,26,90,0),rgb(179,195,255))] p-px transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-full w-full items-center justify-center gap-[6px] rounded-[29px] bg-[rgb(45,49,92)] px-4 py-[15px]">
                {enhancing ? (
                  <Loader2 size={16} className="animate-spin text-white" aria-hidden />
                ) : (
                  <Image src={`${IMG}/enhance-icon.png`} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                )}
                <span className="text-[14px] font-medium leading-[18px] text-white">{enhancing ? "Enhancing…" : "Enhance Prompt"}</span>
              </span>
            </button>
          </div>

          <SelectRow title="Gallery" sub="Save to gallery" value="Default" valueSub={<span>Default</span>} />

          <SelectRow
            title="Aspect Ratio"
            sub="Select image dimensions"
            required
            value={preset.label}
            valueSub={<span>{`${preset.aspectRatio} • ${preset.width}×${preset.height}`}</span>}
            onClick={() => setSheet("aspect")}
            className="mt-6"
          />

          <SelectRow
            title="Composition Type"
            sub="Select image composition style"
            required
            value={composition}
            onClick={() => setSheet("composition")}
            className="mt-6"
          />

          <CheckboxRow
            checked={autoRemoveBg}
            onChange={setAutoRemoveBg}
            title="Auto Remove Background"
            sub="Automatically remove background after generation"
            className="mt-6"
          />

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="iz-border-button mt-10 h-[52px] w-full cursor-pointer rounded-[26px] p-[1.5px] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="iz-btn-primary flex h-full w-full items-center justify-center gap-2 rounded-[23px] text-[16px] font-semibold leading-5 text-white">
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={18} strokeWidth={2} aria-hidden />
                  Generate Image
                </>
              )}
            </span>
          </button>
        </div>

        {/* ---------------- Right pane ---------------- */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 px-6 pb-6 pt-5">
          <div className="flex min-h-[480px] flex-1 flex-col gap-3 overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
            {showConnectNotice ? (
              <div className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-[14px] py-3 text-[13px] leading-[18px] text-white">
                Connect a provider first.{" "}
                <Link href="/settings/providers" className="font-semibold underline underline-offset-2 hover:text-[rgb(167,185,255)]">
                  Open provider settings
                </Link>
              </div>
            ) : notice ? (
              <div role="alert" className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-[14px] py-3 text-[13px] leading-[18px] text-white">
                {notice}
              </div>
            ) : null}

            {generating ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-[14px] px-6">
                <div className="iz-skeleton h-[240px] w-[240px] rounded-[16px]" />
                <div className="text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">This may take 30 sec to 5 min</div>
              </div>
            ) : result ? (
              <>
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- provider URLs / data URIs are not known ahead of time */}
                  <img src={result.url} alt={result.prompt} className="max-h-[60vh] max-w-full rounded-[12px] object-contain min-[900px]:max-h-full" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2">
                    <span className="truncate">{result.model}</span>
                    <span aria-hidden>·</span>
                    <span>{result.size}</span>
                    {result.cost !== undefined ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          Cost {result.cost}
                          {result.remainingBalance !== undefined ? ` · Balance ${result.remainingBalance}` : ""}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer text-white underline-offset-2 hover:underline"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => setPrompt(result.prompt.slice(0, PROMPT_MAX))}
                      className="cursor-pointer text-white underline-offset-2 hover:underline"
                    >
                      Use as prompt seed
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-[14px] px-6">
                <div className="flex h-[240px] w-[240px] items-center justify-center rounded-[16px] border border-dashed border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)]">
                  <ImageIcon size={64} strokeWidth={1.5} className="text-[rgba(255,255,255,0.3)]" aria-hidden />
                </div>
                <div className="text-[16px] font-semibold leading-5 text-white">Nothing here yet</div>
                <div className="max-w-[320px] text-center text-[14px] leading-5 text-[rgba(255,255,255,0.5)]">
                  Describe what you want on the left, pick a model, then tap Generate.
                </div>
              </div>
            )}
          </div>

          {history.length > 0 ? <HistoryStrip items={history} current={result} onPick={select} /> : null}
        </div>
      </div>

      <ImageModelPicker open={sheet === "model"} onClose={() => setSheet(null)} value={settings.imageModel} onSelect={onSelectModel} />
      <OptionSheet
        open={sheet === "aspect"}
        onClose={() => setSheet(null)}
        title="Aspect Ratio"
        value={preset.key}
        onPick={setAspectKey}
        options={presets.map((p) => ({ key: p.key, label: p.label, description: `${p.aspectRatio} • ${p.width}×${p.height}` }))}
      />
      <OptionSheet
        open={sheet === "composition"}
        onClose={() => setSheet(null)}
        title="Composition Type"
        value={composition}
        onPick={(key) => setComposition(key as CompositionType)}
        options={COMPOSITION_OPTIONS.map((c) => ({ key: c.value, label: c.value, description: c.description }))}
      />
    </div>
  );
}

function HistoryStrip({ items, current, onPick }: { items: GeneratedImage[]; current: GeneratedImage | null; onPick: (image: GeneratedImage) => void }) {
  return (
    <div className="iz-scrollbar-hide flex shrink-0 gap-[10px] overflow-x-auto">
      {items.map((img) => {
        const active = current?.id === img.id;
        return (
          <button
            key={img.id}
            type="button"
            onClick={() => onPick(img)}
            aria-label={`Show image: ${img.prompt.slice(0, 60)}`}
            aria-pressed={active}
            className={cn(
              "h-[120px] w-[120px] shrink-0 cursor-pointer overflow-hidden rounded-[12px] border bg-[rgba(255,255,255,0.06)] transition-colors",
              active ? "border-[rgb(167,185,255)]" : "border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)]",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- provider URLs / data URIs are not known ahead of time */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
          </button>
        );
      })}
    </div>
  );
}
