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

export default function LibraryView() {
  const [photos, setPhotos] = useState<LibraryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
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

  async function handleAssign(filename: string, pageSlug: string) {
    setAssigning(filename);
    const res = await fetch("/api/library/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, pageSlug }),
    });
    if (res.ok) {
      // Update local state to reflect the change
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
          <div className="w-12" />
        </div>
      </header>

      {/* Photo list */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {photos.map((photo) => {
          const availablePages = PAGES.filter(
            (p) => !photo.pages.includes(p.slug)
          );

          return (
            <div key={photo.filename} className="mb-6 border-b border-border pb-4">
              <img
                src={`${PHOTO_BASE}${photo.filename}`}
                alt={photo.title || photo.filename}
                className="w-full h-auto"
                loading="lazy"
              />

              {photo.title && (
                <p className="font-[family-name:var(--font-cormorant)] text-lg italic mt-2">
                  {photo.title}
                </p>
              )}
              {photo.desc.length > 0 && (
                <p className="text-xs text-muted mt-1">
                  {photo.desc.join(" · ")}
                </p>
              )}

              {/* Filename */}
              <p className="text-[0.6rem] text-text mt-2 truncate">
                {photo.filename}
              </p>

              {/* Page badges — full width, scrollable */}
              <div className="overflow-x-auto mt-2 -mx-4 px-4">
                <div className="flex gap-1.5">
                  {photo.pages.length > 0 ? (
                    photo.pages.map((slug) => (
                      <span
                        key={slug}
                        className="shrink-0 px-2 py-0.5 bg-white border border-border
                                   text-[0.6rem] text-text tracking-wide"
                      >
                        {PAGE_NAMES[slug] || slug}
                      </span>
                    ))
                  ) : (
                    <span className="text-[0.6rem] text-red-500 italic">
                      Not on any page
                    </span>
                  )}
                </div>
              </div>

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
