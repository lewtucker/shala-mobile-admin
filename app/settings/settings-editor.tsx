"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DesignSettings {
  bgColor: string;
  textColor: string;
  titleFont: string;
  bodyFont: string;
  titleSize: number;
  bodySize: number;
  titleWeight: string;
  titleStyle: string;
  bodyWeight: string;
  bodyStyle: string;
  capTitleFont: string;
  capTitleSize: number;
  capTitleWeight: string;
  capTitleStyle: string;
  capDescFont: string;
  capDescSize: number;
  capDescWeight: string;
  capDescStyle: string;
  capAlign: string;
  subFont: string;
  subSize: number;
  subWeight: string;
  subStyle: string;
}

const FONTS = [
  "Montserrat",
  "Cormorant Garamond",
  "Playfair Display",
  "Libre Baskerville",
  "Lora",
  "EB Garamond",
  "Merriweather",
  "Raleway",
  "Open Sans",
  "Roboto",
];

const WEIGHTS = ["300", "400", "700"];
const STYLES = ["normal", "italic"];
const ALIGNS = ["left", "center", "right"];

const inputClass =
  "w-full px-3 py-2 bg-white border border-border text-sm outline-none focus:border-accent transition-colors";
const selectClass =
  "w-full px-3 py-2 bg-white border border-border text-sm outline-none focus:border-accent transition-colors appearance-none";
const labelClass = "block text-[0.6rem] tracking-[0.2em] uppercase text-muted mb-1";
const sectionClass = "border-b border-border pb-6";

export default function SettingsEditor() {
  const [settings, setSettings] = useState<DesignSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d && !d.error) setSettings(d); setLoading(false); });
  }, [router]);

  function update<K extends keyof DesignSettings>(field: K, value: DesignSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
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

  if (!settings) return null;

  return (
    <div className="min-h-dvh pb-12">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/" className="text-xs tracking-[0.15em] text-muted hover:text-text no-underline">
            ← Back
          </Link>
          <h1 className="text-xs font-medium tracking-[0.2em] uppercase">Design</h1>
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
        {/* Colors */}
        <div className={sectionClass}>
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase mb-4">Colors</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Background</label>
              <input
                type="color"
                value={settings.bgColor}
                onChange={(e) => update("bgColor", e.target.value)}
                className="w-full h-10 border border-border cursor-pointer"
              />
            </div>
            <div>
              <label className={labelClass}>Text</label>
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => update("textColor", e.target.value)}
                className="w-full h-10 border border-border cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Site Title */}
        <div className={sectionClass}>
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase mb-4">Site Title</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Font</label>
              <select value={settings.titleFont} onChange={(e) => update("titleFont", e.target.value)} className={selectClass}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Size (rem)</label>
              <input type="number" step="0.25" min="1" max="6" value={settings.titleSize}
                onChange={(e) => update("titleSize", parseFloat(e.target.value) || 3)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Weight</label>
              <select value={settings.titleWeight} onChange={(e) => update("titleWeight", e.target.value)} className={selectClass}>
                {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Style</label>
              <select value={settings.titleStyle} onChange={(e) => update("titleStyle", e.target.value)} className={selectClass}>
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div className={sectionClass}>
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase mb-4">Subtitle</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Font</label>
              <select value={settings.subFont} onChange={(e) => update("subFont", e.target.value)} className={selectClass}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Size (rem)</label>
              <input type="number" step="0.05" min="0.3" max="3" value={settings.subSize}
                onChange={(e) => update("subSize", parseFloat(e.target.value) || 0.7)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Weight</label>
              <select value={settings.subWeight} onChange={(e) => update("subWeight", e.target.value)} className={selectClass}>
                {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Style</label>
              <select value={settings.subStyle} onChange={(e) => update("subStyle", e.target.value)} className={selectClass}>
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className={sectionClass}>
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase mb-4">Body Text</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Font</label>
              <select value={settings.bodyFont} onChange={(e) => update("bodyFont", e.target.value)} className={selectClass}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Size (px)</label>
              <input type="number" step="1" min="10" max="24" value={settings.bodySize}
                onChange={(e) => update("bodySize", parseInt(e.target.value) || 14)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Weight</label>
              <select value={settings.bodyWeight} onChange={(e) => update("bodyWeight", e.target.value)} className={selectClass}>
                {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Style</label>
              <select value={settings.bodyStyle} onChange={(e) => update("bodyStyle", e.target.value)} className={selectClass}>
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Caption Title */}
        <div className={sectionClass}>
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase mb-4">Caption Title</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Font</label>
              <select value={settings.capTitleFont} onChange={(e) => update("capTitleFont", e.target.value)} className={selectClass}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Size (rem)</label>
              <input type="number" step="0.05" min="0.5" max="3" value={settings.capTitleSize}
                onChange={(e) => update("capTitleSize", parseFloat(e.target.value) || 1.2)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Weight</label>
              <select value={settings.capTitleWeight} onChange={(e) => update("capTitleWeight", e.target.value)} className={selectClass}>
                {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Style</label>
              <select value={settings.capTitleStyle} onChange={(e) => update("capTitleStyle", e.target.value)} className={selectClass}>
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Caption Description */}
        <div className={sectionClass}>
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase mb-4">Caption Description</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Font</label>
              <select value={settings.capDescFont} onChange={(e) => update("capDescFont", e.target.value)} className={selectClass}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Size (rem)</label>
              <input type="number" step="0.05" min="0.3" max="2" value={settings.capDescSize}
                onChange={(e) => update("capDescSize", parseFloat(e.target.value) || 0.75)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Weight</label>
              <select value={settings.capDescWeight} onChange={(e) => update("capDescWeight", e.target.value)} className={selectClass}>
                {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Style</label>
              <select value={settings.capDescStyle} onChange={(e) => update("capDescStyle", e.target.value)} className={selectClass}>
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Caption Alignment */}
        <div className={sectionClass}>
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase mb-4">Caption Alignment</h2>
          <div>
            <select value={settings.capAlign} onChange={(e) => update("capAlign", e.target.value)} className={selectClass}>
              {ALIGNS.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
