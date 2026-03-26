"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function PagesEditor() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPageName, setNewPageName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [renaming, setRenaming] = useState(false);
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
    if (!confirm(`Delete the page "${name}"?\nPhotos will remain in the library.`)) return;
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

  function startEditing(slug: string, name: string) {
    setEditingSlug(slug);
    setEditName(name);
  }

  async function handleRename() {
    if (!editingSlug || !editName.trim()) return;
    setRenaming(true);
    const res = await fetch("/api/pages/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: editingSlug, name: editName.trim() }),
    });
    if (res.ok) {
      setEditingSlug(null);
      setLoading(true);
      fetchContent();
    } else {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      alert(`Error: ${err.error}`);
    }
    setRenaming(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">Loading...</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="min-h-dvh pb-12">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/" className="text-xs tracking-[0.15em] text-muted hover:text-text no-underline">
            ← Back
          </Link>
          <h1 className="text-xs font-medium tracking-[0.2em] uppercase">Edit Pages</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="max-w-sm mx-auto px-6 pt-6">
        {/* Create new page */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            placeholder="New page name"
            className="flex-1 px-3 py-3 bg-white border border-border text-sm
                       outline-none focus:border-accent transition-colors"
            onKeyDown={(e) => { if (e.key === "Enter") handleAddPage(); }}
          />
          <button
            onClick={handleAddPage}
            disabled={adding || !newPageName.trim()}
            className="px-4 py-3 bg-white text-text border border-border text-xs font-medium
                       tracking-[0.15em] uppercase transition-colors hover:bg-[#ddd]
                       disabled:opacity-40"
          >
            {adding ? "..." : "+ Create"}
          </button>
        </div>

        {/* Divider */}
        <div className="w-10 h-px bg-border mx-auto mb-6" />

        {/* Page list */}
        <div className="space-y-3">
          {content.galleryPages.map((page) => (
            <div key={page.slug} className="bg-white border border-border p-4">
              {editingSlug === page.slug ? (
                /* Editing mode */
                <div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-border text-sm
                               outline-none focus:border-accent transition-colors mb-3"
                    onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRename}
                      disabled={renaming || !editName.trim()}
                      className="px-3 py-1.5 bg-white border border-border text-xs font-medium
                                 tracking-[0.1em] uppercase hover:bg-[#ddd] disabled:opacity-40"
                    >
                      {renaming ? "..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingSlug(null)}
                      className="px-3 py-1.5 text-xs text-muted hover:text-text"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{page.name}</p>
                    <p className="text-[0.65rem] text-muted mt-0.5">
                      {page.photos.length} photos · /{page.slug}/
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(page.slug, page.name)}
                      className="px-2 py-1 text-xs text-text hover:bg-[#ddd] transition-colors"
                      title="Rename"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePage(page.slug, page.name)}
                      disabled={deleting === page.slug}
                      className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors
                                 disabled:opacity-40"
                      title="Delete"
                    >
                      {deleting === page.slug ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
