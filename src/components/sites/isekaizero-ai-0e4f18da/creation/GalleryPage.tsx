"use client";

import { Download, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { GalleryImage } from "@/lib/media/gallery";
import { cn } from "@/lib/utils";

import { ConfirmDialog, ToastView, useToast } from "../chat/primitives";
import { Choice } from "./fields";

type Filter = "all" | "used" | "unused";

/** Images (gallery.*): every image saved on this computer (scenes, portraits, covers, manga pages), where it's used. */
export function GalleryPage() {
  const { toast, showToast } = useToast();
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<GalleryImage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GalleryImage | null>(null);

  useEffect(() => {
    fetch("/api/gallery", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ images?: GalleryImage[]; error?: string }>)
      .then((r) => {
        if (r.error) throw new Error(r.error);
        setImages(r.images ?? []);
      })
      .catch((e) => {
        setImages([]);
        showToast(e instanceof Error ? e.message : "Could not load the gallery.");
      });
  }, [showToast]);

  const shown = (images ?? []).filter((i) => filter === "all" || (filter === "used") === i.usedIn.length > 0);
  const remove = async (img: GalleryImage) => {
    const res = await fetch(`/api/gallery?file=${encodeURIComponent(img.file)}`, { method: "DELETE" });
    if (!res.ok) return showToast(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not delete.");
    setImages((list) => list?.filter((i) => i.file !== img.file) ?? null);
    setOpen(null);
    showToast("Image deleted");
  };

  return (
    <div className="mx-auto w-full max-w-[1040px] p-4">
      <h1 className="text-[22px] font-bold">Images</h1>
      <p className="mt-1 text-[13px] text-white/55">Every image saved on this computer: scene illustrations, portraits, covers, backgrounds and manga pages.</p>
      <div className="mt-3 flex items-center gap-3">
        <Choice
          label="Filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All${images ? ` (${images.length})` : ""}` },
            { value: "used", label: "In use" },
            { value: "unused", label: "Unused" },
          ]}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {images === null
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="iz-skeleton aspect-[3/4] rounded-[10px]" />)
          : shown.map((img) => (
              <button key={img.file} type="button" onClick={() => setOpen(img)} className="group relative aspect-[3/4] overflow-hidden rounded-[10px] border border-white/10 bg-[#11123c] hover:border-[#a7b9ff]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                {img.usedIn.length === 0 ? <span className="absolute left-1.5 top-1.5 rounded-[6px] bg-black/60 px-1.5 text-[10px] font-semibold text-white/80">Unused</span> : null}
              </button>
            ))}
      </div>
      {images && shown.length === 0 ? <p className="p-10 text-center text-[14px] text-white/55">No images here.</p> : null}

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(null)}>
          <div role="dialog" aria-label="Image" className="flex max-h-full w-full max-w-[900px] flex-col gap-3 rounded-[16px] bg-[#11123c] p-3 md:flex-row" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.url} alt="" className="max-h-[75vh] min-w-0 flex-1 rounded-[10px] object-contain" />
            <div className="flex w-full shrink-0 flex-col gap-2 text-[13px] md:w-[240px]">
              <div className="flex justify-end">
                <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10">
                  <X size={16} />
                </button>
              </div>
              <div className="text-white/50">
                {new Date(open.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {(open.bytes / 1024).toFixed(0)} KB
              </div>
              <div className="font-semibold">Used in</div>
              {open.usedIn.length ? (
                open.usedIn.map((u) => (
                  <Link key={u.href + u.label} href={u.href} className="truncate text-[#a7b9ff] hover:underline">
                    {u.label}
                  </Link>
                ))
              ) : (
                <div className="text-white/50">Nothing: safe to delete.</div>
              )}
              <div className="mt-auto flex gap-2 pt-3">
                <a href={open.url} download={open.file} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[18px] border border-white/15 font-semibold hover:bg-white/10">
                  <Download size={14} /> Download
                </a>
                <button
                  type="button"
                  disabled={open.usedIn.length > 0}
                  title={open.usedIn.length ? "Still used" : "Delete"}
                  onClick={() => setPendingDelete(open)}
                  className={cn("flex h-9 w-9 items-center justify-center rounded-full border border-white/15 hover:text-[#ffb4ab] disabled:opacity-30")}
                  aria-label="Delete image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete image?"
        description="Nothing uses this image. It is deleted from this computer."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const img = pendingDelete;
          setPendingDelete(null);
          if (img) void remove(img);
        }}
      />
      <ToastView toast={toast} />
    </div>
  );
}
