import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFileContent, commitFiles } from "@/lib/github";
import { parseContent, generateContent } from "@/lib/content-parser";
import { buildNavUpdates } from "@/lib/nav-updater";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug, name } = await request.json();
    if (!slug || !name) {
      return NextResponse.json({ error: "slug and name required" }, { status: 400 });
    }

    const { content: contentMd } = await getFileContent("CONTENT.md");
    const siteContent = parseContent(contentMd);

    // Update name in gallery pages
    const page = siteContent.galleryPages.find((p) => p.slug === slug);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    page.name = name;

    // Also update in pages table
    const pageEntry = siteContent.pages.find((p) => p.slug === slug);
    if (pageEntry) pageEntry.name = name;

    // Update page HTML title
    const { content: pageHtml } = await getFileContent(`${slug}/index.html`);
    let updatedHtml = pageHtml;
    updatedHtml = updatedHtml.replace(/<title>[^<]*<\/title>/, `<title>${name}</title>`);
    updatedHtml = updatedHtml.replace(/(<h1>)[^<]*(<\/h1>)/, `$1${name}$2`);

    // Get about title for nav
    let aboutTitle = "About the Artist";
    try {
      const { content: aboutJs } = await getFileContent("about/about.js");
      const m = aboutJs.match(/title:\s*"([^"]*)"/);
      if (m) aboutTitle = m[1];
    } catch { /* use default */ }

    // Build files
    const files: { path: string; content: string }[] = [
      { path: "CONTENT.md", content: generateContent(siteContent) },
      { path: `${slug}/index.html`, content: updatedHtml },
    ];

    // Update nav on all pages
    const navFiles = await buildNavUpdates(siteContent.galleryPages, aboutTitle);
    files.push(...navFiles);

    await commitFiles(files, `Rename page to "${name}" (mobile admin)`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
