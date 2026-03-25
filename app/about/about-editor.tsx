"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AboutData {
  photo: string;
  title: string;
  bio: string;
  buttonText: string;
}

const PHOTO_BASE = "https://shalaball.com/photos/";
const inputClass =
  "w-full px-3 py-2 bg-white border border-border text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-[0.6rem] tracking-[0.2em] uppercase text-muted mb-1";

export default function AboutEditor() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/about")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d && !d.error) setData(d); setLoading(false); });
  }, [router]);

  function update<K extends keyof AboutData>(field: K, value: AboutData[K]) {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    const res = await fetch("/api/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    setUploading(true);

    // Upload to photos/ via the existing upload API, targeting a dummy page
    // Then update the about data with the new filename
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("pageSlug", "__about__");

    // We need a dedicated upload — use the general upload but just commit the photo
    const res = await fetch("/api/about/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { filename } = await res.json();
      update("photo", filename);
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

  if (!data) return null;

  return (
    <div className="min-h-dvh pb-12">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/" className="text-xs tracking-[0.15em] text-muted hover:text-text no-underline">
            ← Back
          </Link>
          <h1 className="text-xs font-medium tracking-[0.2em] uppercase">About</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`text-xs tracking-[0.15em] font-medium transition-colors
              ${saved ? "text-green-600" : "text-accent"} disabled:opacity-40`}
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Photo */}
        <div>
          <label className={labelClass}>Artist Photo</label>
          {data.photo && (
            <img
              src={`${PHOTO_BASE}${data.photo}`}
              alt="Artist"
              className="w-full max-w-xs h-auto mb-3"
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs tracking-[0.15em] text-accent hover:text-text transition-colors disabled:opacity-40"
          >
            {uploading ? "Uploading..." : "Change Photo"}
          </button>
        </div>

        {/* Title */}
        <div>
          <label className={labelClass}>Page Title</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Bio */}
        <div>
          <label className={labelClass}>Bio</label>
          <textarea
            value={data.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={12}
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </div>

        {/* Button Text */}
        <div>
          <label className={labelClass}>Button Text</label>
          <input
            type="text"
            value={data.buttonText}
            onChange={(e) => update("buttonText", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
