"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LibraryPhoto {
  filename: string;
  pages: string[];
  title: string;
  desc: string[];
  zoom: number;
}

const PHOTO_BASE = "https://shalaball.com/photos/";

const PAGES: { slug: string; name: string }[] = [
  { slug: "page-2", name: "Paintings" },
  { slug: "page-3", name: "Works on Paper" },
  { slug: "page-1", name: "Mixed Media" },
  { slug: "all", name: "All" },
  { slug: "cards", name: "Available Work" },
];

const PAGE_NAMES: Record<string, string> = Object.fromEntries(
  PAGES.map((p) => [p.slug, p.name])
);

const inputClass =
  "w-full px-3 py-2 bg-white border border-border text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-[0.6rem] tracking-[0.2em] uppercase text-text mb-1";

export default function LibraryView() {
  const [photos, setPhotos] = useState<LibraryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [rotating, setRotating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const fetchLibrary = useCallback(() => {
    fetch("/api/library")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setPhotos(data);
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  function updatePhoto(filename: string, field: keyof LibraryPhoto, value: string | string[] | number) {
    setPhotos((prev) =>
      prev.map((p) => (p.filename === filename ? { ...p, [field]: value } : p))
    );
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    const updates: Record<string, { title: string; desc: string[]; zoom: number }> = {};
    for (const photo of photos) {
      updates[photo.filename] = {
        title: photo.title,
        desc: photo.desc,
        zoom: photo.zoom,
      };
    }
    const res = await fetch("/api/library/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const err = await res.json().catch(() => ({ error: "Save failed" }));
      alert(`Error: ${err.error}`);
    }
  }

  async function handleRotate(filename: string, direction: "cw" | "ccw") {
    setRotating(filename);
    const res = await fetch("/api/library/rotate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, direction }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Rotate failed" }));
      alert(`Error: ${err.error}`);
    }
    setRotating(null);
    // Force image reload by updating state with cache buster
    setPhotos((prev) =>
      prev.map((p) =>
        p.filename === filename ? { ...p, _bust: Date.now() } as LibraryPhoto : p
      )
    );
  }

  function handleZoom(filename: string, direction: "in" | "out") {
    const photo = photos.find((p) => p.filename === filename);
    if (!photo) return;
    const factor = 1.3;
    const newZoom = direction === "in"
      ? Math.round(photo.zoom * factor * 100) / 100
      : Math.round((photo.zoom / factor) * 100) / 100;
    updatePhoto(filename, "zoom", Math.max(0.3, Math.min(5, newZoom)));
  }

  async function handleAssign(filename: string, pageSlug: string) {
    setAssigning(filename);
    const res = await fetch("/api/library/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, pageSlug }),
    });
    if (res.ok) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.filename === filename && !p.pages.includes(pageSlug)
            ? { ...p, pages: [...p.pages, pageSlug] }
            : p
        )
      );
    } else {
      const err = await res.json().catch(() => ({ error: "Assign failed" }));
      alert(`Error: ${err.error}`);
    }
    setAssigning(null);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch("/api/library/upload", { method: "POST", body: formData });
    if (res.ok) {
      setLoading(true);
      fetchLibrary();
    } else {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      alert(`Upload error: ${err.error}`);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/" className="text-xs tracking-[0.15em] text-muted hover:text-text no-underline">
            ← Back
          </Link>
          <h1 className="text-xs font-medium tracking-[0.2em] uppercase">
            Library ({photos.length})
          </h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`text-xs tracking-[0.15em] font-medium transition-colors
              ${saved ? "text-green-600" : dirty ? "text-accent" : "text-muted"} disabled:opacity-40`}
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </header>

      {/* Photo list */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {photos.map((photo) => {
          const availablePages = PAGES.filter((p) => !photo.pages.includes(p.slug));

          return (
            <div key={photo.filename} className="mb-8 border-b border-border pb-6">
              {/* Photo with rotate/zoom controls */}
              <div className="relative">
                <img
                  src={`${PHOTO_BASE}${photo.filename}?t=${(photo as unknown as Record<string, unknown>)._bust || ""}`}
                  alt={photo.title || photo.filename}
                  className="w-full h-auto"
                  loading="lazy"
                  style={photo.zoom !== 1 ? { transform: `scale(${photo.zoom})`, transformOrigin: "center" } : undefined}
                />
                {/* Rotate + zoom controls */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => handleRotate(photo.filename, "ccw")}
                    disabled={rotating === photo.filename}
                    className="w-8 h-8 bg-black/50 text-white text-sm rounded-full disabled:opacity-30"
                    title="Rotate left"
                  >↺</button>
                  <button
                    onClick={() => handleRotate(photo.filename, "cw")}
                    disabled={rotating === photo.filename}
                    className="w-8 h-8 bg-black/50 text-white text-sm rounded-full disabled:opacity-30"
                    title="Rotate right"
                  >↻</button>
                  <button
                    onClick={() => handleZoom(photo.filename, "out")}
                    className="w-8 h-8 bg-black/50 text-white text-sm rounded-full"
                    title="Zoom out"
                  >−</button>
                  <button
                    onClick={() => handleZoom(photo.filename, "in")}
                    className="w-8 h-8 bg-black/50 text-white text-sm rounded-full"
                    title="Zoom in"
                  >+</button>
                </div>
                {rotating === photo.filename && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-xs tracking-wide">Rotating...</span>
                  </div>
                )}
              </div>

              {/* Editable title */}
              <div className="mt-3">
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  value={photo.title}
                  onChange={(e) => updatePhoto(photo.filename, "title", e.target.value)}
                  placeholder="Title"
                  className={`${inputClass} font-[family-name:var(--font-cormorant)] text-lg italic`}
                />
              </div>

              {/* Editable description lines */}
              <div className="mt-2 space-y-1">
                <label className={labelClass}>Description</label>
                {photo.desc.map((line, i) => (
                  <input
                    key={`${photo.filename}-desc-${i}`}
                    type="text"
                    value={line}
                    onChange={(e) => {
                      const newDesc = [...photo.desc];
                      newDesc[i] = e.target.value;
                      updatePhoto(photo.filename, "desc", newDesc);
                    }}
                    placeholder={i === 0 ? "Medium" : i === 1 ? "Dimensions" : i === 2 ? "Year" : "Detail"}
                    className="w-full px-3 py-1.5 bg-white border border-border text-xs
                               outline-none focus:border-accent transition-colors"
                  />
                ))}
                <button
                  onClick={() => updatePhoto(photo.filename, "desc", [...photo.desc, ""])}
                  className="text-xs text-muted hover:text-text tracking-wide"
                >
                  + Add detail line
                </button>
              </div>

              {/* Filename */}
              <p className="text-[0.6rem] text-text mt-3 truncate">{photo.filename}</p>

              {/* Pages list */}
              <p className="text-xs text-text mt-2">
                {photo.pages.length > 0 ? (
                  <>
                    <span className="font-medium">Pages: </span>
                    {photo.pages.map((slug) => PAGE_NAMES[slug] || slug).join(", ")}
                  </>
                ) : (
                  <span className="text-red-500 italic">Not on any page</span>
                )}
              </p>

              {/* Add to page dropdown */}
              {availablePages.length > 0 && (
                <div className="mt-2">
                  <select
                    defaultValue=""
                    disabled={assigning === photo.filename}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssign(photo.filename, e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="w-full px-2 py-1.5 bg-white border border-border text-xs text-text
                               outline-none focus:border-accent transition-colors"
                  >
                    <option value="" disabled>
                      {assigning === photo.filename ? "Adding..." : "+ Add to page..."}
                    </option>
                    {availablePages.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
            {uploading ? "Uploading..." : "+ Add Photo to Library"}
          </button>
        </div>
      </div>
    </div>
  );
}
