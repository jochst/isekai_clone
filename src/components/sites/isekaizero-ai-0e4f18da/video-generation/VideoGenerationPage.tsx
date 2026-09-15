"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Clapperboard, Download, ImagePlus, Loader2, Sparkles, X } from "lucide-react";

import { PROVIDER_PRESETS, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import { cn } from "@/lib/utils";
import type { VideoParamValue } from "@/types/isekaizero";

import { SelectRow } from "../image-generation/form-ui";
import { useProviderCatalog } from "../image-generation/use-provider-catalog";
import { VIDEO_PROVIDER_NOT_CONFIGURED_ERROR, useVideoGeneration, type VideoJob } from "./use-video-generation";
import { VideoModelPicker } from "./VideoModelPicker";
import { VideoParamsForm, paramSummary } from "./VideoParamsForm";

const PROMPT_MAX = 3000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const VIDEO_UNSUPPORTED = "Video generation requires the NanoGPT preset.";

interface SourceImage {
  url: string;
  name: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

function statusLabel(job: VideoJob): string {
  switch (job.status) {
    case "queued":
      return "Queued";
    case "generating":
      return "Generating";
    case "done":
      return "Done";
    case "canceled":
      return "Canceled";
    default:
      return "Failed";
  }
}

export interface VideoGenerationPageProps {
  className?: string;
}

/** Standalone video tool (`/creation/generate-video`): form on the left, player + history on the right. */
export function VideoGenerationPage({ className }: VideoGenerationPageProps) {
  const [settings, updateSettings, hydrated] = useProviderSettings();
  const catalog = useProviderCatalog();
  const { jobs, submit, cancel, error, clearError } = useVideoGeneration(settings);

  const [prompt, setPrompt] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [source, setSource] = useState<SourceImage | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const configured = Boolean(settings.baseUrl && settings.apiKey);
  const presetLabel = PROVIDER_PRESETS.find((p) => p.id === settings.preset)?.label ?? "Provider";
  const model = catalog.videoById(settings.videoModel);
  const values = useMemo<Record<string, VideoParamValue>>(() => ({ ...(model?.defaults ?? {}), ...settings.videoParams }), [model, settings.videoParams]);

  const supportsImage = model?.imageToVideo ?? true;
  const needsImage = model !== undefined && !model.textToVideo && model.imageToVideo;
  const generating = jobs.some((j) => j.status === "queued" || j.status === "generating");
  const current = (selectedId ? jobs.find((j) => j.id === selectedId) : undefined) ?? jobs[0] ?? null;

  const onSelectModel = useCallback(
    (m: { id: string; defaults: Record<string, VideoParamValue> }) => updateSettings({ videoModel: m.id, videoParams: m.defaults }),
    [updateSettings],
  );

  const onFile = async (file: File | undefined) => {
    setLocalError(null);
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError("Source image must be 10 MB or smaller.");
      return;
    }
    try {
      setSource({ url: await readAsDataUrl(file), name: file.name });
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Could not read the file");
    }
  };

  const onUseUrl = () => {
    const url = urlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      setLocalError("Paste an http(s) image URL.");
      return;
    }
    setLocalError(null);
    setSource({ url, name: url });
    setUrlInput("");
  };

  const onGenerate = async () => {
    setLocalError(null);
    clearError();
    if (needsImage && !source) {
      setLocalError("This model needs a source image.");
      return;
    }
    const job = await submit({ model: settings.videoModel, prompt: prompt.trim(), params: values, imageUrl: supportsImage && source ? source.url : undefined });
    if (job) setSelectedId(job.id);
  };

  const canGenerate = prompt.trim().length > 0 && Boolean(settings.videoModel) && !generating && catalog.videoSupported;
  const notice = localError ?? error;
  const showConnectNotice = (hydrated && !configured) || notice === VIDEO_PROVIDER_NOT_CONFIGURED_ERROR;
  const unsupported = hydrated && configured && catalog.status === "ready" && !catalog.videoSupported;

  return (
    <div className={cn("flex min-h-screen flex-col text-white", className)}>
      <div className="flex flex-1 flex-col min-[900px]:h-[calc(100vh-114px)] min-[900px]:flex-row">
        {/* ---------------- Left form ---------------- */}
        <div className="flex w-full shrink-0 flex-col px-5 pb-8 pt-5 min-[900px]:w-[459px] min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[rgba(255,255,255,0.06)]">
          <SelectRow
            title="Model"
            sub="Select AI model for generation"
            required
            value={model?.name ?? (settings.videoModel || "Select a model")}
            valueSub={<span>{model?.priceSummary ?? presetLabel}</span>}
            onClick={() => setSheetOpen(true)}
          />
          {unsupported ? <p className="mt-1 text-[12px] leading-4 text-[#ffb4ab]">{catalog.videoReason ?? VIDEO_UNSUPPORTED}</p> : null}

          <div className="my-6 flex flex-col">
            <label htmlFor="iz-video-prompt" className="text-[18px] font-semibold leading-[22px] text-white">
              Prompt<span className="text-[rgb(255,87,71)]"> *</span>
            </label>
            <textarea
              id="iz-video-prompt"
              value={prompt}
              maxLength={PROMPT_MAX}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={supportsImage && source ? "Describe the motion and camera..." : "Describe the video you want to generate..."}
              className="mt-[5px] h-[160px] w-full resize-none rounded-[12px] border border-[rgba(167,185,255,0.5)] bg-[rgb(47,51,80)] p-4 text-[16px] leading-6 text-white outline-none placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgb(167,185,255)]"
            />
            <div className="mt-1 text-right text-[12px] leading-4 text-[rgba(255,255,255,0.4)]">
              {prompt.length} / {PROMPT_MAX}
            </div>
          </div>

          {supportsImage ? (
            <div className="mb-6 flex flex-col gap-2">
              <div className="text-[18px] font-semibold leading-[22px] text-white">
                Source image{needsImage ? <span className="text-[rgb(255,87,71)]"> *</span> : null}
              </div>
              <div className="text-[14px] leading-[17px] text-[rgba(255,255,255,0.5)]">Animate a still image (image-to-video)</div>
              {source ? (
                <div className="flex items-center gap-3 rounded-[12px] border border-[rgba(167,185,255,0.25)] bg-black/30 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied URL or data URI */}
                  <img src={source.url} alt="" className="h-16 w-16 rounded-[8px] object-cover" />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-white/70">{source.name}</span>
                  <button type="button" aria-label="Remove source image" onClick={() => setSource(null)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex h-11 items-center justify-center gap-2 rounded-[12px] border border-dashed border-[rgba(255,255,255,0.25)] bg-white/[0.04] text-[14px] font-medium hover:bg-white/[0.08]">
                    <ImagePlus size={18} /> Upload image
                  </button>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="or paste an image URL"
                      aria-label="Source image URL"
                      className="h-10 min-w-0 flex-1 rounded-[10px] border border-[rgba(167,185,255,0.4)] bg-[rgb(47,51,80)] px-3 text-[14px] text-white outline-none placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgb(167,185,255)]"
                    />
                    <button type="button" onClick={onUseUrl} disabled={!urlInput.trim()} className="h-10 rounded-[10px] border border-white/15 bg-white/[0.06] px-3 text-[13px] font-semibold disabled:opacity-50">
                      Use
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {model ? (
            <div className="mb-6">
              <div className="mb-1 text-[18px] font-semibold leading-[22px] text-white">Parameters</div>
              <div className="mb-2 text-[14px] leading-[17px] text-[rgba(255,255,255,0.5)]">{paramSummary(model.params, values) || "Model defaults"}</div>
              <VideoParamsForm specs={model.params} values={values} defaults={model.defaults} onChange={(videoParams) => updateSettings({ videoParams })} />
            </div>
          ) : null}

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="iz-border-button mt-4 h-[52px] w-full cursor-pointer rounded-[26px] p-[1.5px] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
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
                  Generate Video
                </>
              )}
            </span>
          </button>
          {generating && current?.runId ? (
            <button type="button" onClick={() => cancel(current.id)} className="mt-2 self-center text-[12px] text-white/60 hover:underline">
              Stop waiting
            </button>
          ) : null}
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

            {current && (current.status === "queued" || current.status === "generating") ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-[14px] px-6">
                <div className="iz-skeleton aspect-video w-full max-w-[480px] rounded-[16px]" />
                <div className="text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">Generating video… this can take a few minutes</div>
              </div>
            ) : current && current.status === "done" ? (
              <>
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <video src={current.url} controls playsInline preload="metadata" className="max-h-[60vh] max-w-full rounded-[12px] min-[900px]:max-h-full" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2">
                    <span className="truncate">{current.model}</span>
                    {current.cost !== undefined ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>Cost {current.cost}</span>
                      </>
                    ) : null}
                  </div>
                  <a href={current.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-white underline-offset-2 hover:underline">
                    <Download size={14} /> Download
                  </a>
                </div>
              </>
            ) : current ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-3 py-[10px] text-[12px] leading-4 text-[#ffb4ab]">{current.error ?? "Video generation failed."}</div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-[14px] px-6">
                <div className="flex h-[240px] w-[240px] items-center justify-center rounded-[16px] border border-dashed border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)]">
                  <Clapperboard size={64} strokeWidth={1.5} className="text-[rgba(255,255,255,0.3)]" aria-hidden />
                </div>
                <div className="text-[16px] font-semibold leading-5 text-white">Nothing here yet</div>
                <div className="max-w-[320px] text-center text-[14px] leading-5 text-[rgba(255,255,255,0.5)]">Describe the motion on the left, pick a model, then tap Generate.</div>
              </div>
            )}
          </div>

          {jobs.length > 0 ? (
            <div className="iz-scrollbar-hide flex shrink-0 gap-[10px] overflow-x-auto">
              {jobs.map((job) => {
                const active = current?.id === job.id;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedId(job.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex h-[72px] w-[160px] shrink-0 flex-col justify-between rounded-[12px] border bg-[rgba(255,255,255,0.06)] p-2 text-left transition-colors",
                      active ? "border-[rgb(167,185,255)]" : "border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)]",
                    )}
                  >
                    <span className="iz-line-clamp-2 text-[11px] leading-4 text-white/80">{job.prompt}</span>
                    <span className="text-[10px] uppercase tracking-[0.5px] text-white/50">{statusLabel(job)}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <VideoModelPicker open={sheetOpen} onClose={() => setSheetOpen(false)} value={settings.videoModel} onSelect={onSelectModel} />
    </div>
  );
}
