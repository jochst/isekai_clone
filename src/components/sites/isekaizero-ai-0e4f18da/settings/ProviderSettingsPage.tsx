"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Activity, Check, Cpu, Eye, EyeOff, KeyRound, RotateCcw, Search } from "lucide-react";

import type { ProviderImageModel, ProviderTextModel } from "@/app/api/providers/models/route";
import {
  DEFAULT_PROVIDER_SETTINGS,
  isProviderConfigured,
  PROVIDER_PRESETS,
  providerHeaders,
  useProviderSettings,
  type ProviderPresetDef,
} from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { ProviderSettings } from "@/types/isekaizero";
import { cn } from "@/lib/utils";

import { SettingsShell, type SettingsTab } from "./SettingsShell";
import {
  Field,
  GradientButton,
  InfoNote,
  OutlineButton,
  ResetButton,
  SegmentedControl,
  SelectRow,
  SettingCard,
  SettingRow,
  TEXT_INPUT_CLASS,
  TextInput,
  type SegmentedOption,
} from "./ui";

type TabKey = "provider" | "models" | "usage";

const TABS: readonly SettingsTab<TabKey>[] = [
  { key: "provider", label: "API Provider", icon: KeyRound },
  { key: "models", label: "Models", icon: Cpu },
  { key: "usage", label: "Usage", icon: Activity },
];

const IMAGE_SIZE_OPTIONS: readonly SegmentedOption<string>[] = [
  { value: "1024x1024", label: "1024x1024" },
  { value: "1024x768", label: "1024x768" },
  { value: "768x1024", label: "768x1024" },
  { value: "1344x768", label: "1344x768" },
  { value: "768x1344", label: "768x1344" },
];

interface ModelsResponse {
  text: ProviderTextModel[];
  images: ProviderImageModel[];
  preset: string;
  baseUrl: string;
}

type ModelsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ModelsResponse };

async function fetchProviderModels(settings: ProviderSettings): Promise<ModelsResponse> {
  const res = await fetch("/api/providers/models", { headers: providerHeaders(settings), cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as Partial<ModelsResponse> & { error?: string };
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return { text: json.text ?? [], images: json.images ?? [], preset: json.preset ?? settings.preset, baseUrl: json.baseUrl ?? settings.baseUrl };
}

/* ---------- Usage (localStorage `iz.usage.v1`, maintained by the chat page) ---------- */

export const USAGE_STORAGE_KEY = "iz.usage.v1";

export interface UsageStats {
  chats: number;
  tokensIn: number;
  tokensOut: number;
  images: number;
  estimatedCost: number;
}

const EMPTY_USAGE: UsageStats = { chats: 0, tokensIn: 0, tokensOut: 0, images: 0, estimatedCost: 0 };

let cachedUsageRaw: string | null = null;
let cachedUsage: UsageStats = EMPTY_USAGE;

function readUsage(): UsageStats {
  if (typeof window === "undefined") return EMPTY_USAGE;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(USAGE_STORAGE_KEY);
  } catch {
    return EMPTY_USAGE;
  }
  if (raw === cachedUsageRaw) return cachedUsage;
  cachedUsageRaw = raw;
  try {
    cachedUsage = raw ? { ...EMPTY_USAGE, ...(JSON.parse(raw) as Partial<UsageStats>) } : EMPTY_USAGE;
  } catch {
    cachedUsage = EMPTY_USAGE;
  }
  return cachedUsage;
}

function subscribeUsage(onChange: () => void): () => void {
  window.addEventListener("iz:usage", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("iz:usage", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function useUsage(): [UsageStats, () => void] {
  const usage = useSyncExternalStore(subscribeUsage, readUsage, () => EMPTY_USAGE);
  const reset = useCallback(() => {
    try {
      window.localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(EMPTY_USAGE));
      window.dispatchEvent(new CustomEvent("iz:usage"));
    } catch {
      /* storage unavailable */
    }
  }, []);
  return [usage, reset];
}

/* ---------- Page ---------- */

/** Body of `/settings/providers` (rendered under the page's PageHeader). */
export function ProviderSettingsPage() {
  const [tab, setTab] = useState<TabKey>("provider");
  const [settings, update, hydrated] = useProviderSettings();
  const [models, setModels] = useState<ModelsState>({ status: "idle" });

  const preset = PROVIDER_PRESETS.find((p) => p.id === settings.preset) ?? PROVIDER_PRESETS[0];
  const configured = isProviderConfigured(settings);

  const loadModels = useCallback(async (): Promise<ModelsResponse> => {
    setModels({ status: "loading" });
    try {
      const data = await fetchProviderModels(settings);
      setModels({ status: "ready", data });
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setModels({ status: "error", message });
      throw e;
    }
  }, [settings]);

  const resetAll = useCallback(() => {
    update(DEFAULT_PROVIDER_SETTINGS);
    setModels({ status: "idle" });
  }, [update]);

  return (
    <SettingsShell
      intro="Bring your own key. Requests go straight from this app to your provider — keys stay in this browser."
      onReset={resetAll}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "provider" ? (
        <ProviderTab
          settings={settings}
          preset={preset}
          update={update}
          onTest={loadModels}
          onPresetChange={() => setModels({ status: "idle" })}
        />
      ) : null}
      {tab === "models" ? (
        <ModelsTab
          settings={settings}
          update={update}
          configured={hydrated && configured}
          models={models}
          loadModels={loadModels}
        />
      ) : null}
      {tab === "usage" ? <UsageTab /> : null}
    </SettingsShell>
  );
}

/* ---------- API Provider tab ---------- */

interface ProviderTabProps {
  settings: ProviderSettings;
  preset: ProviderPresetDef;
  update: (patch: Partial<ProviderSettings>) => void;
  onTest: () => Promise<ModelsResponse>;
  onPresetChange: () => void;
}

type TestState = { kind: "idle" } | { kind: "testing" } | { kind: "ok"; text: number; images: number } | { kind: "fail"; message: string };

function ProviderTab({ settings, preset, update, onTest, onPresetChange }: ProviderTabProps) {
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>({ kind: "idle" });

  const selectPreset = (p: ProviderPresetDef) => {
    update({
      preset: p.id,
      baseUrl: p.baseUrl,
      imageBaseUrl: p.imageBaseUrl,
      textModel: p.defaultTextModel,
      imageModel: p.defaultImageModel,
    });
    setTest({ kind: "idle" });
    onPresetChange();
  };

  const runTest = async () => {
    setTest({ kind: "testing" });
    try {
      const data = await onTest();
      setTest({ kind: "ok", text: data.text.length, images: data.images.length });
    } catch (e) {
      setTest({ kind: "fail", message: e instanceof Error ? e.message : "Unknown error" });
    }
  };

  const imageBase = settings.imageBaseUrl || settings.baseUrl;

  return (
    <>
      <div className="mb-3 grid grid-cols-1 gap-[10px] sm:grid-cols-2">
        {PROVIDER_PRESETS.map((p) => {
          const selected = p.id === settings.preset;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected}
              onClick={() => selectPreset(p)}
              className={cn(
                "flex cursor-pointer flex-col gap-[6px] rounded-[12px] border p-[14px] text-left transition-colors duration-150",
                selected
                  ? "border-[rgb(167,185,255)] bg-[rgba(42,65,228,0.18)]"
                  : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.25)]",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-[14px] font-bold leading-[18px] text-white">{p.label}</span>
                {p.id === "nano-gpt" ? (
                  <span className="iz-gradient-accent rounded-[8px] px-2 py-[2px] text-[10px] font-bold leading-[12px] text-[rgb(47,51,80)]">
                    Recommended
                  </span>
                ) : null}
              </span>
              <span className="text-[12px] leading-4 text-[rgba(255,255,255,0.6)]">{p.description}</span>
            </button>
          );
        })}
      </div>

      <SettingCard title="Connection">
        <Field
          label="API key"
          htmlFor="iz-provider-api-key"
          helper={
            <>
              <span>Stored only in this browser (localStorage). Never sent anywhere except your provider.</span>
              {preset.keysUrl ? (
                <a
                  href={preset.keysUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-[12px] leading-4 text-[rgb(167,185,255)] hover:underline"
                >
                  Get a {preset.label} key ›
                </a>
              ) : null}
            </>
          }
        >
          <div className="relative">
            <input
              id="iz-provider-api-key"
              type={showKey ? "text" : "password"}
              value={settings.apiKey}
              onChange={(e) => update({ apiKey: e.target.value.trim() })}
              placeholder="sk-…"
              autoComplete="off"
              spellCheck={false}
              className={cn(TEXT_INPUT_CLASS, "pr-11")}
            />
            <button
              type="button"
              aria-label={showKey ? "Hide API key" : "Show API key"}
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center text-[rgba(255,255,255,0.6)] hover:text-white"
            >
              {showKey ? <EyeOff size={18} strokeWidth={2} aria-hidden /> : <Eye size={18} strokeWidth={2} aria-hidden />}
            </button>
          </div>
        </Field>

        <Field label="Chat base URL" htmlFor="iz-provider-base-url">
          <TextInput
            id="iz-provider-base-url"
            type="url"
            value={settings.baseUrl}
            onChange={(baseUrl) => update({ baseUrl: baseUrl.trim() })}
            placeholder="https://nano-gpt.com/api/v1"
          />
        </Field>

        <Field
          label="Image base URL"
          htmlFor="iz-provider-image-base-url"
          helper="NanoGPT serves images at https://nano-gpt.com/v1"
        >
          <TextInput
            id="iz-provider-image-base-url"
            type="url"
            value={settings.imageBaseUrl}
            onChange={(imageBaseUrl) => update({ imageBaseUrl: imageBaseUrl.trim() })}
            placeholder="https://nano-gpt.com/v1"
          />
        </Field>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <GradientButton onClick={runTest} disabled={test.kind === "testing" || !settings.apiKey || !settings.baseUrl}>
            {test.kind === "testing" ? "Testing…" : "Test connection"}
          </GradientButton>
          <OutlineButton
            onClick={() => {
              update({ apiKey: "" });
              setTest({ kind: "idle" });
            }}
            disabled={!settings.apiKey}
          >
            Clear key
          </OutlineButton>
        </div>

        {test.kind === "ok" ? (
          <p className="mt-3 flex items-center gap-[6px] text-[13px] leading-[18px] text-[rgb(128,202,16)]">
            <Check size={16} strokeWidth={2.5} aria-hidden />
            Connected · {test.text} text models · {test.images} image models
          </p>
        ) : null}
        {test.kind === "fail" ? (
          <p className="mt-3 text-[13px] leading-[18px] text-[rgb(255,87,71)]">{test.message}</p>
        ) : null}
      </SettingCard>

      <InfoNote>
        <ul className="list-disc space-y-1 pl-4">
          <li>
            Chat uses <code className="text-white">POST {settings.baseUrl || "{base}"}/chat/completions</code> with streaming.
          </li>
          <li>
            Scene images use <code className="text-white">POST {imageBase || "{imageBase}"}/images/generations</code>{" "}
            (OpenAI-compatible).
          </li>
          <li>
            Model lists come from <code className="text-white">GET {settings.baseUrl || "{base}"}/models</code> and{" "}
            <code className="text-white">GET {settings.baseUrl || "{base}"}/image-models</code> when available.
          </li>
        </ul>
      </InfoNote>
    </>
  );
}

/* ---------- Models tab ---------- */

interface ModelsTabProps {
  settings: ProviderSettings;
  update: (patch: Partial<ProviderSettings>) => void;
  configured: boolean;
  models: ModelsState;
  loadModels: () => Promise<ModelsResponse>;
}

type OpenPicker = "text" | "image" | null;

function formatPrice(n: number): string {
  return n >= 10 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n.toFixed(3);
}

function ModelsTab({ settings, update, configured, models, loadModels }: ModelsTabProps) {
  const [open, setOpen] = useState<OpenPicker>(null);

  useEffect(() => {
    if (configured && models.status === "idle") {
      loadModels().catch(() => undefined);
    }
  }, [configured, models.status, loadModels]);

  const textRows = models.status === "ready" ? models.data.text : [];
  const imageRows = models.status === "ready" ? models.data.images : [];
  const currentText = textRows.find((m) => m.id === settings.textModel);
  const currentImage = imageRows.find((m) => m.id === settings.imageModel);

  if (!configured) {
    return <InfoNote>Add an API key in the API Provider tab to load your provider&apos;s models.</InfoNote>;
  }

  return (
    <>
      <SettingCard>
        {models.status === "loading" ? (
          <div className="flex flex-col gap-3">
            <div className="iz-skeleton h-[49px] rounded-[10px]" />
            <div className="iz-skeleton h-[49px] rounded-[10px]" />
          </div>
        ) : (
          <>
            {models.status === "error" ? (
              <p className="mb-3 text-[13px] leading-[18px] text-[rgb(255,87,71)]">{models.message}</p>
            ) : null}

            <SelectRow
              title="Text model"
              description="Used for every new chat"
              value={currentText?.name || settings.textModel || "Not set"}
              valueDescription={currentText && currentText.name !== currentText.id ? currentText.id : undefined}
              onClick={() => setOpen((v) => (v === "text" ? null : "text"))}
            />
            {open === "text" ? (
              <ModelList
                rows={textRows.map((m) => ({
                  id: m.id,
                  name: m.name,
                  price:
                    m.inputPerM !== undefined && m.outputPerM !== undefined
                      ? `${formatPrice(m.inputPerM)}/${formatPrice(m.outputPerM)} $ per M`
                      : undefined,
                }))}
                selected={settings.textModel}
                emptyMessage="No text models reported by this provider."
                onSelect={(id) => {
                  update({ textModel: id });
                  setOpen(null);
                }}
              />
            ) : null}

            <div className="my-1 h-px bg-[rgba(255,255,255,0.08)]" />

            <SelectRow
              title="Image model"
              description="Used for Illustration scene images"
              value={currentImage?.name || settings.imageModel || "Not set"}
              valueDescription={currentImage && currentImage.name !== currentImage.id ? currentImage.id : undefined}
              onClick={() => setOpen((v) => (v === "image" ? null : "image"))}
            />
            {open === "image" ? (
              <ModelList
                rows={imageRows.map((m) => ({
                  id: m.id,
                  name: m.name,
                  price: m.costPerImage !== undefined ? `$${m.costPerImage.toFixed(3)} per image` : undefined,
                }))}
                selected={settings.imageModel}
                emptyMessage="No image models reported by this provider."
                onSelect={(id) => {
                  update({ imageModel: id });
                  setOpen(null);
                }}
              />
            ) : null}
          </>
        )}
      </SettingCard>

      <SettingCard title="Image size">
        <SegmentedControl
          label="Image size"
          options={IMAGE_SIZE_OPTIONS}
          value={settings.imageSize}
          onChange={(imageSize) => update({ imageSize })}
        />
      </SettingCard>

      <SettingCard>
        <SettingRow
          title="Auto Illustrate"
          description="Automatically generate scene images when new messages arrive"
          checked={settings.autoIllustrate}
          onChange={(autoIllustrate) => update({ autoIllustrate })}
          className="py-0"
        />
      </SettingCard>
    </>
  );
}

interface ModelListRow {
  id: string;
  name: string;
  price?: string;
}

interface ModelListProps {
  rows: ModelListRow[];
  selected: string;
  emptyMessage: string;
  onSelect: (id: string) => void;
}

function ModelList({ rows, selected, emptyMessage, onSelect }: ModelListProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="mb-2 mt-1">
      <div className="relative">
        <Search
          size={16}
          strokeWidth={2}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.45)]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models"
          aria-label="Search models"
          autoFocus
          spellCheck={false}
          className={cn(TEXT_INPUT_CLASS, "h-10 pl-9")}
        />
      </div>
      <div className="mt-2 max-h-[320px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-[10px] text-[13px] text-[rgba(255,255,255,0.55)]">
            {rows.length === 0 ? emptyMessage : "No models match your search."}
          </p>
        ) : (
          filtered.map((r) => {
            const active = r.id === selected;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 py-[10px] text-left transition-colors duration-100 hover:bg-[rgba(255,255,255,0.06)]",
                  active && "bg-[rgba(167,185,255,0.12)]",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] leading-[18px] text-white">{r.name}</span>
                  {r.name !== r.id ? (
                    <span className="block truncate text-[11px] leading-[15px] text-[rgba(255,255,255,0.45)]">{r.id}</span>
                  ) : null}
                </span>
                {r.price ? (
                  <span className="shrink-0 text-[11px] leading-[15px] text-[rgba(255,255,255,0.6)]">{r.price}</span>
                ) : null}
                {active ? <Check size={16} strokeWidth={2.5} aria-hidden className="shrink-0 text-[rgb(167,185,255)]" /> : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------- Usage tab ---------- */

function UsageTab() {
  const [usage, resetUsage] = useUsage();
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <SettingCard>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[16px] font-bold leading-5 text-white">Session usage</div>
        <ResetButton onClick={resetUsage}>
          <RotateCcw size={13} strokeWidth={2} aria-hidden />
          <span>Reset usage</span>
        </ResetButton>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <StatTile label="LLM Usage" value={`${fmt(usage.tokensIn)} / ${fmt(usage.tokensOut)}`} hint="tokens in / out" />
        <StatTile label="Image Generation" value={fmt(usage.images)} hint="images" />
        <StatTile label="Cost" value={`$${usage.estimatedCost.toFixed(4)}`} hint="estimated USD" />
        <StatTile label="Count" value={fmt(usage.chats)} hint="messages" />
      </div>
    </SettingCard>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[12px] bg-[rgba(255,255,255,0.05)] p-[14px]">
      <div className="text-[11px] uppercase leading-4 tracking-[0.5px] text-[rgba(255,255,255,0.5)]">{label}</div>
      <div className="mt-1 truncate font-heading text-[22px] font-bold leading-7 text-white">{value}</div>
      {hint ? <div className="mt-[2px] text-[11px] leading-4 text-[rgba(255,255,255,0.4)]">{hint}</div> : null}
    </div>
  );
}
