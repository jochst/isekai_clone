"use client";

import { Loader2, Pause, Play, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cloneMyVoice, createDesignedVoice, deleteMyVoice, designVoice, listMyVoices, type MyVoice, type VoicePreview } from "@/lib/sites/isekaizero-ai-0e4f18da/voices";
import { cn } from "@/lib/utils";

import { ConfirmDialog, ToastView, useToast } from "../chat/primitives";
import { Card, Choice, INPUT, Input, Label, TextArea } from "./fields";

/** One shared player so starting a preview stops the last one. */
function usePlayer() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => audio.current?.pause(), []);
  const toggle = (key: string, url: string) => {
    audio.current?.pause();
    if (playing === key) return setPlaying(null);
    audio.current = new Audio(url);
    audio.current.onended = () => setPlaying(null);
    void audio.current.play().catch(() => setPlaying(null));
    setPlaying(key);
  };
  return { playing, toggle };
}

function PlayButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" aria-label={active ? "Stop voice preview" : `Play voice preview: ${label}`} onClick={onClick} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
      {active ? <Pause size={15} /> : <Play size={15} />}
    </button>
  );
}

/** Voices (voice.*, voiceEdit.*): My Voice on the ElevenLabs account, designed from a description or cloned from a clip. */
export function VoicesPage() {
  const { toast, showToast } = useToast();
  const { playing, toggle } = usePlayer();
  const [voices, setVoices] = useState<MyVoice[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<"design" | "clone">("design");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [script, setScript] = useState("");
  const [previews, setPreviews] = useState<VoicePreview[]>([]);
  const [picked, setPicked] = useState<string>();
  const [clip, setClip] = useState<File>();
  const [busy, setBusy] = useState<"" | "designing" | "creating">("");
  const [pendingDelete, setPendingDelete] = useState<MyVoice | null>(null);

  const reload = () =>
    listMyVoices()
      .then(setVoices)
      .catch((e) => {
        setVoices([]);
        setLoadError(e instanceof Error ? e.message : "Could not load your voices.");
      });
  useEffect(() => {
    void reload();
  }, []);

  const fail = (e: unknown) => showToast(e instanceof Error ? e.message : "Voice design failed");

  const design = async () => {
    setBusy("designing");
    setPreviews([]);
    setPicked(undefined);
    try {
      const out = await designVoice(description, script);
      setPreviews(out.previews);
      if (!script.trim()) setScript(out.text);
      showToast(`${out.previews.length} previews generated! Listen to each and select your favorite.`);
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  };

  const create = async () => {
    if (!name.trim()) return showToast("Voice name is required");
    setBusy("creating");
    try {
      if (mode === "design") {
        if (!picked) return showToast("Listen to each preview and select your favorite.");
        await createDesignedVoice(name, description, picked, previews.map((p) => p.generatedVoiceId).filter((id) => id !== picked));
      } else {
        if (!clip) return showToast("No audio file is attached");
        await cloneMyVoice(name, description, clip);
      }
      showToast("Voice created!");
      setName("");
      setDescription("");
      setScript("");
      setPreviews([]);
      setPicked(undefined);
      setClip(undefined);
      await reload();
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[960px] p-4">
      <h1 className="text-[22px] font-bold">Voices</h1>
      <p className="mt-1 text-[13px] text-white/55">Voices live on your ElevenLabs account. Give one to a character (Character editor → Voice) and it speaks their lines in Visual Novel mode and dramas.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card title="New Voice">
          <Label title="Creation Type">
            <Choice
              label="Creation Type"
              value={mode}
              onChange={setMode}
              options={[
                { value: "design", label: "Design Voice" },
                { value: "clone", label: "Clone" },
              ]}
            />
          </Label>
          <Label title="Name">
            <Input value={name} onChange={setName} placeholder="Eg. Yunari, Kuro, Sora" maxLength={80} />
          </Label>
          {mode === "design" ? (
            <>
              <Label title="Voice Description" hint={`Describe the voice in English: age, gender, accent, pitch, pace, tone. 30-250 characters${description.length < 30 ? ` (${30 - description.length} more needed)` : ""}.`}>
                <TextArea value={description} onChange={setDescription} rows={3} maxLength={250} placeholder="A warm, friendly voice with a subtle smile; natural pacing; clear articulation." />
              </Label>
              <Label title="Sample Voice Script" hint="What the previews say, 100-1000 characters. Leave empty and ElevenLabs writes one to suit the description.">
                <TextArea value={script} onChange={setScript} rows={3} maxLength={1000} placeholder="Hello, I'm excited to help you today!" />
              </Label>
              <button
                type="button"
                onClick={() => void design()}
                disabled={busy !== "" || description.trim().length < 30}
                className="flex h-10 items-center justify-center gap-2 rounded-[20px] border border-[rgba(167,185,255,0.4)] bg-[rgba(42,65,228,0.18)] text-[13px] font-semibold hover:bg-[rgba(42,65,228,0.3)] disabled:opacity-50"
              >
                {busy === "designing" ? <Loader2 size={14} className="animate-spin" /> : null}
                {busy === "designing" ? "Designing voice..." : previews.length ? "Generate More" : "Design Voice"}
              </button>
              {previews.length ? (
                <div className="flex flex-col gap-2">
                  <div className="text-[12px] text-white/55">Select Your Voice: listen to each preview and select your favorite.</div>
                  {previews.map((p, i) => (
                    <label key={p.generatedVoiceId} className={cn("flex items-center gap-3 rounded-[12px] border p-2.5", picked === p.generatedVoiceId ? "border-[#a7b9ff] bg-[rgba(167,185,255,0.1)]" : "border-white/10")}>
                      <PlayButton active={playing === p.generatedVoiceId} onClick={() => toggle(p.generatedVoiceId, p.audio)} label={`Preview ${i + 1}`} />
                      <span className="flex-1 text-[13px]">
                        Preview {i + 1}
                        {p.durationSecs ? <span className="text-white/45"> · {p.durationSecs.toFixed(1)} s</span> : null}
                      </span>
                      <input type="radio" name="voice-preview" checked={picked === p.generatedVoiceId} onChange={() => setPicked(p.generatedVoiceId)} />
                    </label>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <Label title="Description" hint="Short description to describe how the voice is like.">
                <Input value={description} onChange={setDescription} placeholder="She spoke soft" maxLength={500} />
              </Label>
              <Label title="Audio" hint="Upload an audio clip (MP3, WAV, M4A, FLAC, OGG, AAC) between 30 to 60 seconds for best result, single speaker only. Max file size: 10 MB. Cloning needs a paid ElevenLabs plan.">
                <label className={cn(INPUT, "flex h-11 cursor-pointer items-center gap-2")}>
                  <Upload size={15} className="shrink-0 text-white/60" />
                  <span className="truncate text-white/75">{clip ? clip.name : "Press here to add your audio."}</span>
                  <input type="file" accept=".mp3,.wav,.m4a,.flac,.ogg,.aac,audio/*" hidden onChange={(e) => setClip(e.target.files?.[0])} />
                </label>
              </Label>
            </>
          )}
          <button type="button" onClick={() => void create()} disabled={busy !== ""} className="iz-btn-primary flex h-10 items-center justify-center gap-2 rounded-[20px] text-[13px] font-semibold disabled:opacity-50">
            {busy === "creating" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {busy === "creating" ? "Creating voice..." : "Create Voice"}
          </button>
        </Card>

        <Card title="My Voice">
          {loadError ? <p className="text-[12px] text-[#ffb4ab]">{loadError}</p> : null}
          {voices === null ? (
            <div className="iz-skeleton h-14 rounded-[12px]" />
          ) : voices.length === 0 ? (
            <p className="text-[13px] text-white/55">You haven&apos;t created any voices yet</p>
          ) : (
            voices.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-black/15 p-2.5">
                {v.previewUrl ? <PlayButton active={playing === v.id} onClick={() => toggle(v.id, v.previewUrl!)} label={v.name} /> : null}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">{v.name}</div>
                  <div className="truncate text-[11px] text-white/50">
                    {v.category === "cloned" ? "Cloned" : v.category === "generated" ? "Designed" : v.category}
                    {v.description ? ` · ${v.description}` : ""}
                  </div>
                </div>
                <button type="button" aria-label={`Delete ${v.name}`} onClick={() => setPendingDelete(v)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-[#ffb4ab]">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete Voice"
        description={pendingDelete ? `Are you sure you want to delete "${pendingDelete.name}"? It is removed from your ElevenLabs account; characters using it fall back to a default voice.` : undefined}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const v = pendingDelete;
          setPendingDelete(null);
          if (v) void deleteMyVoice(v.id).then(reload).catch(fail);
        }}
      />
      <ToastView toast={toast} />
    </div>
  );
}
