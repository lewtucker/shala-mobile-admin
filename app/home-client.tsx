"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function HomeClient() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPageName, setNewPageName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const fetchContent = useCallback(() => {
    fetch("/api/content")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setContent(data.siteContent);
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  async function handleAddPage() {
    if (!newPageName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPageName.trim() }),
    });
    if (res.ok) {
      setNewPageName("");
      setLoading(true);
      fetchContent();
    } else {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      alert(`Error: ${err.error}`);
    }
    setAdding(false);
  }

  async function handleDeletePage(slug: string, name: string) {
    if (!confirm(`Delete the page "${name}"? Photos will remain in the library.`)) return;
    setDeleting(slug);
    const res = await fetch("/api/pages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (res.ok) {
      setLoading(true);
      fetchContent();
    } else {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      alert(`Error: ${err.error}`);
    }
    setDeleting(null);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">Loading...</p>
      </div>
    );
  }

  if (!content) return null;

  const editablePages = content.galleryPages;

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="text-center pt-12 pb-4 px-4">
        <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-bold tracking-[0.15em]">
          Shala Ball
        </h1>
        <p className="text-[0.65rem] tracking-[0.3em] uppercase text-muted mt-2 font-medium">
          Gallery Admin
        </p>
      </header>

      {/* Divider */}
      <div className="w-10 h-px bg-border mx-auto my-6" />

      {/* Home & Settings */}
      <div className="flex flex-col items-center gap-3 max-w-sm mx-auto px-6 pb-4">
        <Link
          href="/home"
          className="block w-full py-4 px-6 bg-white text-text border border-border text-center
                     text-xs font-medium tracking-[0.25em] uppercase
                     transition-colors hover:bg-[#ddd] no-underline"
        >
          Home Page
          <span className="block text-[0.6rem] text-[#444] mt-1 tracking-[0.1em] italic normal-case">
            Title, subtitle, footer, CTA
          </span>
        </Link>
        <Link
          href="/settings"
          className="block w-full py-4 px-6 bg-white text-text border border-border text-center
                     text-xs font-medium tracking-[0.25em] uppercase
                     transition-colors hover:bg-[#ddd] no-underline"
        >
          Design Settings
          <span className="block text-[0.6rem] text-[#444] mt-1 tracking-[0.1em] italic normal-case">
            Fonts, colors, alignment
          </span>
        </Link>
        <Link
          href="/about"
          className="block w-full py-4 px-6 bg-white text-text border border-border text-center
                     text-xs font-medium tracking-[0.25em] uppercase
                     transition-colors hover:bg-[#ddd] no-underline"
        >
          About the Artist
          <span className="block text-[0.6rem] text-[#444] mt-1 tracking-[0.1em] italic normal-case">
            Photo, bio, button text
          </span>
        </Link>
        <Link
          href="/library"
          className="block w-full py-4 px-6 bg-white text-text border border-border text-center
                     text-xs font-medium tracking-[0.25em] uppercase
                     transition-colors hover:bg-[#ddd] no-underline"
        >
          Photo Library
          <span className="block text-[0.6rem] text-[#444] mt-1 tracking-[0.1em] italic normal-case">
            All photos, page assignments
          </span>
        </Link>
      </div>

      {/* Divider */}
      <div className="w-10 h-px bg-border mx-auto my-4" />

      {/* Gallery pages */}
      <div className="flex flex-col items-center gap-3 max-w-sm mx-auto px-6 pb-4">
        {editablePages.map((page) => (
          <div key={page.slug} className="w-full flex gap-2">
            <Link
              href={`/page/${page.slug}`}
              className="flex-1 py-4 px-6 bg-white text-text border border-border text-center
                         text-xs font-medium tracking-[0.25em] uppercase
                         transition-colors hover:bg-[#ddd] no-underline"
            >
              {page.name}
              <span className="block text-[0.6rem] text-[#444] mt-1 tracking-[0.1em] italic normal-case">
                {page.photos.length} photos
              </span>
            </Link>
            <button
              onClick={() => handleDeletePage(page.slug, page.name)}
              disabled={deleting === page.slug}
              className="px-3 bg-white border border-border text-red-500 text-sm
                         transition-colors hover:bg-red-50 disabled:opacity-40"
              title={`Delete ${page.name}`}
            >
              {deleting === page.slug ? "..." : "✕"}
            </button>
          </div>
        ))}
      </div>

      {/* Add new page */}
      <div className="max-w-sm mx-auto px-6 pb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            placeholder="New page name"
            className="flex-1 px-3 py-2 bg-white border border-border text-sm
                       outline-none focus:border-accent transition-colors"
            onKeyDown={(e) => { if (e.key === "Enter") handleAddPage(); }}
          />
          <button
            onClick={handleAddPage}
            disabled={adding || !newPageName.trim()}
            className="px-4 py-2 bg-white text-text border border-border text-xs font-medium
                       tracking-[0.15em] uppercase transition-colors hover:bg-[#ddd]
                       disabled:opacity-40"
          >
            {adding ? "..." : "+ Add"}
          </button>
        </div>
      </div>

      {/* View live site */}
      <div className="text-center pb-8">
        <a
          href="https://shalaball.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.15em] text-muted hover:text-text transition-colors"
        >
          View Live Site →
        </a>
      </div>

      {/* Logout */}
      <div className="text-center pb-12">
        <button
          onClick={handleLogout}
          className="text-xs tracking-[0.15em] text-muted hover:text-text transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
