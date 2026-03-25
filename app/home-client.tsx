"use client";

import { useEffect, useState } from "react";
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
  const router = useRouter();

  useEffect(() => {
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
      <div className="flex flex-col items-center gap-3 max-w-sm mx-auto px-6 pb-8">
        {editablePages.map((page) => (
          <Link
            key={page.slug}
            href={`/page/${page.slug}`}
            className="block w-full py-4 px-6 bg-white text-text border border-border text-center
                       text-xs font-medium tracking-[0.25em] uppercase
                       transition-colors hover:bg-[#ddd] no-underline"
          >
            {page.name}
            <span className="block text-[0.6rem] text-[#444] mt-1 tracking-[0.1em] italic normal-case">
              {page.photos.length} photos
            </span>
          </Link>
        ))}
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
