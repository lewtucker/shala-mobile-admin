"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HomeData {
  title: string;
  subtitle: string;
  footer: string;
  ctaText: string;
  ctaHref: string;
  ctaColor: string;
  ctaFont: string;
  ctaSize: number;
  ctaWeight: string;
  ctaStyle: string;
  ctaVisible: boolean;
}

const inputClass =
  "w-full px-3 py-2 bg-white border border-border text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-[0.6rem] tracking-[0.2em] uppercase text-muted mb-1";

export default function HomeEditor() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/home")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d && !d.error) setData(d); setLoading(false); });
  }, [router]);

  function update<K extends keyof HomeData>(field: K, value: HomeData[K]) {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    const res = await fetch("/api/home", {
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
          <h1 className="text-xs font-medium tracking-[0.2em] uppercase">Home Page</h1>
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
        {/* Site Title */}
        <div>
          <label className={labelClass}>Site Title</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            className={`${inputClass} font-[family-name:var(--font-montserrat)] text-xl font-bold tracking-[0.1em]`}
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className={labelClass}>Subtitle</label>
          <input
            type="text"
            value={data.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Footer */}
        <div>
          <label className={labelClass}>Footer Text</label>
          <input
            type="text"
            value={data.footer}
            onChange={(e) => update("footer", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Divider */}
        <div className="w-10 h-px bg-border mx-auto my-4" />

        {/* CTA Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className={`${labelClass} mb-0`}>Call to Action</span>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={data.ctaVisible}
                onChange={(e) => update("ctaVisible", e.target.checked)}
                className="accent-accent"
              />
              Visible
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className={labelClass}>CTA Text</label>
              <input
                type="text"
                value={data.ctaText}
                onChange={(e) => update("ctaText", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>CTA Link</label>
              <input
                type="text"
                value={data.ctaHref}
                onChange={(e) => update("ctaHref", e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Color</label>
                <input
                  type="color"
                  value={data.ctaColor}
                  onChange={(e) => update("ctaColor", e.target.value)}
                  className="w-full h-10 border border-border cursor-pointer"
                />
              </div>
              <div>
                <label className={labelClass}>Size (rem)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="3"
                  value={data.ctaSize}
                  onChange={(e) => update("ctaSize", parseFloat(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
