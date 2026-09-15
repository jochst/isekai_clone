"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Download, Upload, RefreshCw, BookOpen } from "lucide-react";
import type { ImportJob } from "@/lib/imports/types";

interface LibraryEntry {
  id: string; kind: string; source: string; sourceUrl?: string; contentRating: string;
  title: string; creator: string; imageUrl?: string; warnings: string[];
}
interface LibraryData { entries: LibraryEntry[]; total: number; jobs: ImportJob[]; workerOnline: boolean }
const field = "w-full rounded-xl border border-white/20 bg-[#111d38] p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-300";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-indigo-200 disabled:opacity-50";
const panel = "rounded-2xl border border-white/10 bg-white/5 p-5";

async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

export function ImportLibrary() {
  const [data, setData] = useState<LibraryData>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<{ title: string; creator: string; kind: string; contentRating: string; warnings: string[] }>();
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("url");
  const [kind, setKind] = useState("story");
  const [pages, setPages] = useState(1);
  const [interval, setIntervalMinutes] = useState(0);
  const [page, setPage] = useState(0);
  const refresh = useCallback(async () => {
    try { setData(await api(`/api/imports?page=${page}`)); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not refresh imports."); }
  }, [page]);
  useEffect(() => {
    let active = true;
    const update = async () => {
      try { const next = await api(`/api/imports?page=${page}`); if (active) setData(next); }
      catch (e) { if (active) setError(e instanceof Error ? e.message : "Could not load imports."); }
    };
    void update();
    const timer = window.setInterval(() => { void update(); }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [page]);

  async function action(work: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await work(); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Import failed."); }
    finally { setBusy(false); }
  }

  function upload(previewOnly: boolean) {
    if (!file) return;
    void action(async () => {
      const form = new FormData(); form.set("file", file); form.set("preview", String(previewOnly));
      const result = await api("/api/imports", { method: "POST", body: form });
      if (previewOnly) setPreview(result.preview);
      else { setNotice("Imported into your library."); setPreview(undefined); }
    });
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-white sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm text-indigo-200">Your private collection</p><h1 className="mt-1 text-3xl font-semibold">Import characters & stories</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Bring your characters, worlds, and opening scenes into Isekai. Keep their creators credited and use your configured chat provider.</p></div>
        <Link href="/explore" className="rounded-xl border border-white/20 px-4 py-3 text-sm">Explore library</Link>
      </header>
      <div role="status" aria-live="polite" className="text-sm">{notice}</div>
      {error && <p role="alert" className="rounded-xl border border-red-300/40 bg-red-950/40 p-4 text-sm text-red-100">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panel}>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Upload size={20} /> Upload a card</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">JSON or a character card PNG (up to 20 MB). Supports Tavern V1, V2, and V3 exports from Chub, JanitorAI, anime.gf, and other compatible apps.</p>
          <label className="mt-5 block text-sm">Character or story file<input type="file" accept=".json,.png,application/json,image/png" className={`${field} mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:p-2 file:text-white`} onChange={e => { setFile(e.target.files?.[0]); setPreview(undefined); }} /></label>
          <div className="mt-4 flex gap-3"><button className={button} disabled={!file || busy} onClick={() => upload(true)}>Preview</button><button className={button} disabled={!file || busy} onClick={() => upload(false)}>Import file</button></div>
          {preview && <div className="mt-4 rounded-xl bg-black/20 p-4 text-sm"><strong>{preview.title}</strong><p className="mt-1 text-slate-300">{preview.kind} · {preview.contentRating} · by {preview.creator}</p>{preview.warnings.map((w, i) => <p key={i} className="mt-2 text-amber-200">{w}</p>)}</div>}
        </section>
        <section className={panel}>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><RefreshCw size={20} /> Import in the background</h2>
          <form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); void action(async () => {
            await api("/api/imports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: mode === "discover" ? "https://www.isekaizero.ai/" : url, mode, kind, pages, intervalMinutes: interval }) });
            setNotice("Job queued. The background worker will pick it up.");
          }); }}>
            <label className="block text-sm">Import method<select className={`${field} mt-2`} value={mode} onChange={e => setMode(e.target.value)}><option value="url">Single character or story URL</option><option value="discover">Discover recent Isekai entries</option></select></label>
            {mode === "url" ? <label className="block text-sm">Source URL<input required type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.isekaizero.ai/storylines/…" className={`${field} mt-2`} /><span className="mt-2 block text-xs leading-5 text-slate-300">Isekai and Chub detail links, or direct JSON/PNG downloads. Use file uploads for JanitorAI and anime.gf account exports.</span></label> : <div className="grid grid-cols-2 gap-3"><label className="text-sm">Content<select value={kind} onChange={e => setKind(e.target.value)} className={`${field} mt-2`}><option value="story">Stories</option><option value="character">Characters</option></select></label><label className="text-sm">Pages per rating feed<input type="number" min={1} max={10} value={pages} onChange={e => setPages(Number(e.target.value))} className={`${field} mt-2`} /></label></div>}
            <label className="block text-sm">Schedule<select value={interval} onChange={e => setIntervalMinutes(Number(e.target.value))} className={`${field} mt-2`}><option value={0}>Run once</option><option value={60}>Every hour</option><option value={360}>Every 6 hours</option><option value={1440}>Every day</option></select></label>
            <p className="text-xs leading-5 text-slate-300">All returned content ratings are included. Discovery reads both standard and mature feeds, up to 48 entries per page pair. Already imported URLs are updated without adding duplicates.</p>
            <button disabled={busy} className={button}>Queue import</button>
          </form>
        </section>
      </div>
      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Background jobs</h2><span className={`rounded-full px-3 py-1 text-xs ${data?.workerOnline ? "bg-emerald-900/50 text-emerald-200" : "bg-amber-900/40 text-amber-200"}`}>{data?.workerOnline ? "Worker online" : "Worker offline"}</span></div>
        {!data?.workerOnline && <p className="mt-3 text-sm text-slate-300">Start <code className="rounded bg-black/30 px-2 py-1">npm run imports:worker</code> alongside the app. Jobs and schedules stay saved when the app closes.</p>}
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
          {!data?.jobs.length && <p className="text-sm text-slate-400">No jobs yet. Queue a source above.</p>}
          {data?.jobs.map(job => <div key={job.id} className="rounded-xl border border-white/10 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3"><span className="min-w-0 break-all">{job.payload.mode === "discover" ? `Discover Isekai ${job.payload.kind === "character" ? "characters" : "stories"}` : job.payload.url}</span><span className="shrink-0 text-indigo-200">{job.state} · attempt {job.attempts}</span></div>
            {job.error && <p className="mt-2 text-red-200">{job.error}</p>}
            {job.result && <p className="mt-2 text-slate-300">{job.result.startsWith("import-") ? <Link className="underline" href={`/storylines/${job.result}`}>Open imported entry</Link> : job.result}</p>}
            {job.state === "queued" && <p className="mt-1 text-xs text-slate-400">Scheduled: {new Date(job.nextRun).toLocaleString()}</p>}
            <button disabled={busy} className="mt-2 text-xs text-indigo-200 underline disabled:opacity-50" onClick={() => { void action(async () => { await api(`/api/imports/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: ["queued", "running"].includes(job.state) ? "cancel" : "retry" }) }); }); }}>{["queued", "running"].includes(job.state) ? "Cancel job / schedule" : "Run again"}</button>
          </div>)}
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-xl font-semibold"><BookOpen size={22} /> Imported library <span className="text-sm text-slate-400">{data?.total ?? 0}</span></h2><button className="text-sm text-indigo-200 underline" onClick={() => { void refresh(); }}>Refresh</button></div>
        {!data ? <p className="text-sm text-slate-400">Loading library…</p> : data.total === 0 ? <div className={`${panel} text-center text-slate-300`}>Your collection starts with one file or link.</div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.entries.map(entry => <article key={entry.id} className={panel}>
            <div className="flex gap-3">
              {entry.imageUrl && <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg"><Image unoptimized src={entry.imageUrl} alt="" width={64} height={96} className="h-full w-full object-cover" /></div>}
              <div className="min-w-0"><Link href={`/storylines/${entry.id}`} className="text-base font-semibold hover:underline">{entry.title}</Link><p className="mt-1 text-xs text-slate-300">by {entry.creator}</p><p className="mt-2 text-xs text-indigo-200">{entry.kind} · {entry.source} · {entry.contentRating}</p></div>
            </div>
            {entry.warnings.length > 0 && <details className="mt-3 text-xs text-amber-200"><summary className="cursor-pointer">Import notes ({entry.warnings.length})</summary>{entry.warnings.map((w, i) => <p key={i} className="mt-2 leading-5">{w}</p>)}</details>}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs"><Link className="text-indigo-200 underline" href={`/storylines/${entry.id}`}>Open & chat</Link><a className="inline-flex items-center gap-1 text-slate-300" href={`/api/imports/${entry.id}?export=true`}><Download size={14} /> Export JSON</a>{entry.sourceUrl && <a className="text-slate-300 underline" href={entry.sourceUrl} target="_blank" rel="noreferrer">Source</a>}</div>
          </article>)}
        </div>}
        {data && data.total > 48 && <div className="mt-5 flex items-center justify-center gap-4"><button className={button} disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button><span className="text-sm">Page {page + 1} of {Math.ceil(data.total / 48)}</span><button className={button} disabled={(page + 1) * 48 >= data.total} onClick={() => setPage(p => p + 1)}>Next</button></div>}
      </section>
    </main>
  );
}
