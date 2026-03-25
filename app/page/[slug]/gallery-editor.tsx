"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PhotoMeta {
  title: string;
  desc: string[];
  zoom?: number;
}

interface PageInfo {
  slug: string;
  name: string;
  hidden?: boolean;
  photos: string[];
}

interface SiteContent {
  pages: PageInfo[];
  galleryPages: PageInfo[];
}

const PHOTO_BASE = "https://shalaball.com/photos/";

export default function GalleryEditor({ slug }: { slug: string }) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [metadata, setMetadata] = useState<Record<string, PhotoMeta>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const page = content?.galleryPages.find((p) => p.slug === slug);

  const fetchContent = useCallback(() => {
    fetch("/api/content")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setContent(data.siteContent);
          // Normalize desc to always be arrays
          const normalized: Record<string, PhotoMeta> = {};
          for (const [key, val] of Object.entries(data.metadata as Record<string, PhotoMeta>)) {
            normalized[key] = {
              ...val,
              desc: Array.isArray(val.desc) ? val.desc : val.desc ? [val.desc] : [],
            };
          }
          setMetadata(normalized);
        }
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  async function handleSave() {
    if (!content) return;
    setSaving(true);
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteContent: content, metadata }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("pageSlug", slug);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      setLoading(true);
      fetchContent();
      setDirty(false);
    } else {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      alert(`Upload error: ${err.error}`);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRemoveFromPage(filename: string) {
    if (!confirm(`Remove this photo from ${page?.name}?`)) return;

    const res = await fetch("/api/delete-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, pageSlug: slug }),
    });
    if (res.ok) {
      setLoading(true);
      fetchContent();
    }
  }

  function movePhoto(index: number, direction: -1 | 1) {
    if (!content || !page) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= page.photos.length) return;

    const newPhotos = [...page.photos];
    [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];

    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        galleryPages: prev.galleryPages.map((p) =>
          p.slug === slug ? { ...p, photos: newPhotos } : p
        ),
      };
    });
    setDirty(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">Loading...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted">Page not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-xs tracking-[0.15em] text-muted hover:text-text no-underline"
          >
            ← Back
          </Link>
          <h1 className="text-xs font-medium tracking-[0.2em] uppercase">
            {page.name}
          </h1>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`text-xs tracking-[0.15em] font-medium transition-colors
              ${saved ? "text-green-600" : dirty ? "text-accent" : "text-muted"}
              disabled:opacity-40`}
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </header>

      {/* Photo list */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {page.photos.map((filename, index) => {
          const meta = metadata[filename] || { title: "", desc: [], zoom: 1 };
          return (
            <div key={filename} className="mb-6 border-b border-border pb-6">
              {/* Photo */}
              <div className="relative">
                <img
                  src={`${PHOTO_BASE}${filename}`}
                  alt={meta.title || filename}
                  className="w-full h-auto"
                  loading="lazy"
                />
                {/* Reorder + remove controls */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => movePhoto(index, -1)}
                    disabled={index === 0}
                    className="w-8 h-8 bg-black/50 text-white text-sm rounded-full
                               disabled:opacity-30 active:bg-black/70"
                  >↑</button>
                  <button
                    onClick={() => movePhoto(index, 1)}
                    disabled={index === page.photos.length - 1}
                    className="w-8 h-8 bg-black/50 text-white text-sm rounded-full
                               disabled:opacity-30 active:bg-black/70"
                  >↓</button>
                  <button
                    onClick={() => handleRemoveFromPage(filename)}
                    className="w-8 h-8 bg-red-600/70 text-white text-sm rounded-full
                               active:bg-red-700"
                  >✕</button>
                </div>
              </div>

              {/* Read-only title and description */}
              <div className="mt-3">
                {meta.title && (
                  <p className="font-[family-name:var(--font-cormorant)] text-lg italic">
                    {meta.title}
                  </p>
                )}
                {meta.desc.length > 0 && (
                  <p className="text-xs text-muted mt-1">
                    {meta.desc.join(" · ")}
                  </p>
                )}
              </div>

              {/* Filename */}
              <p className="text-[0.6rem] text-text mt-2 truncate">{filename}</p>
            </div>
          );
        })}
      </div>

      {/* Upload button — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border p-4">
        <div className="max-w-2xl mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-3 bg-white text-text border border-border text-xs font-medium
                       tracking-[0.25em] uppercase transition-colors hover:bg-[#ddd]
                       disabled:opacity-40"
          >
            {uploading ? "Uploading..." : "+ Add Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
