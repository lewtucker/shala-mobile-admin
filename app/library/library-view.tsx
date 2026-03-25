"use client";

import { useEffect, useState } from "react";
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

const PAGE_NAMES: Record<string, string> = {
  "page-1": "Mixed Media",
  "page-2": "Paintings",
  "page-3": "Works on Paper",
  all: "All",
  cards: "Available Work",
};

export default function LibraryView() {
  const [photos, setPhotos] = useState<LibraryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-12">
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

      {/* Photo grid */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {photos.map((photo) => (
          <div key={photo.filename} className="mb-6 border-b border-border pb-4">
            <img
              src={`${PHOTO_BASE}${photo.filename}`}
              alt={photo.title || photo.filename}
              className="w-full h-auto"
              loading="lazy"
            />
            <div className="mt-2">
              {photo.title && (
                <p className="font-[family-name:var(--font-cormorant)] text-lg italic">
                  {photo.title}
                </p>
              )}
              {photo.desc.length > 0 && (
                <p className="text-xs text-muted mt-1">
                  {photo.desc.join(" · ")}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[0.6rem] text-border truncate flex-1">
                  {photo.filename}
                </span>
                {photo.pages.length > 0 ? (
                  <span className="text-[0.6rem] text-muted">
                    {photo.pages.map((p) => PAGE_NAMES[p] || p).join(", ")}
                  </span>
                ) : (
                  <span className="text-[0.6rem] text-red-400 italic">
                    Not on any page
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
