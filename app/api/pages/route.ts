import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFileContent, commitFiles, deleteFile } from "@/lib/github";
import { parseContent, generateContent } from "@/lib/content-parser";
import { buildNavUpdates } from "@/lib/nav-updater";

// Create a new page
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Check if page already exists
    const { content: contentMd } = await getFileContent("CONTENT.md");
    const siteContent = parseContent(contentMd);

    if (siteContent.galleryPages.find((p) => p.slug === slug)) {
      return NextResponse.json({ error: "A page with that name already exists" }, { status: 400 });
    }

    // Add to gallery pages in CONTENT.md
    siteContent.galleryPages.push({
      slug,
      name,
      url: `https://shalaball.com/${slug}/`,
      photos: [],
    });

    // Also add to the pages table
    siteContent.pages.push({
      slug,
      name,
      url: `https://shalaball.com/${slug}/`,
      photos: [],
    });

    // Build new page HTML from page-2 template
    const { content: templateHtml } = await getFileContent("page-2/index.html");
    let newPageHtml = templateHtml;
    newPageHtml = newPageHtml.replace(/<title>[^<]*<\/title>/, `<title>${name}</title>`);
    newPageHtml = newPageHtml.replace(/(<h1>)[^<]*(<\/h1>)/, `$1${name}$2`);
    newPageHtml = newPageHtml.replace(/class="gallery two-column"/, 'class="gallery"');

    // Build files to commit
    const files: { path: string; content: string }[] = [
      { path: "CONTENT.md", content: generateContent(siteContent) },
      { path: `${slug}/index.html`, content: newPageHtml },
      { path: `${slug}/labels.js`, content: "// Auto-generated from CONTENT.md\n\nconst LABELS = [];\n" },
    ];

    // Get about title for nav
    let aboutTitle = "About the Artist";
    try {
      const { content: aboutJs } = await getFileContent("about/about.js");
      const m = aboutJs.match(/title:\s*"([^"]*)"/);
      if (m) aboutTitle = m[1];
    } catch { /* use default */ }

    // Update nav on all pages
    const navFiles = await buildNavUpdates(
      siteContent.galleryPages,
      aboutTitle
    );
    files.push(...navFiles);

    await commitFiles(files, `Add page "${name}" (mobile admin)`);

    return NextResponse.json({ ok: true, slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete a page
export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const { content: contentMd } = await getFileContent("CONTENT.md");
    const siteContent = parseContent(contentMd);

    const pageIdx = siteContent.galleryPages.findIndex((p) => p.slug === slug);
    if (pageIdx === -1) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const pageName = siteContent.galleryPages[pageIdx].name;

    // Remove from gallery pages and pages table
    siteContent.galleryPages.splice(pageIdx, 1);
    siteContent.pages = siteContent.pages.filter((p) => p.slug !== slug);

    // Get about title for nav
    let aboutTitle = "About the Artist";
    try {
      const { content: aboutJs } = await getFileContent("about/about.js");
      const m = aboutJs.match(/title:\s*"([^"]*)"/);
      if (m) aboutTitle = m[1];
    } catch { /* use default */ }

    // Build files to commit (updated CONTENT.md + nav on all remaining pages)
    const files: { path: string; content: string }[] = [
      { path: "CONTENT.md", content: generateContent(siteContent) },
    ];

    const navFiles = await buildNavUpdates(
      siteContent.galleryPages,
      aboutTitle
    );
    files.push(...navFiles);

    await commitFiles(files, `Delete page "${pageName}" (mobile admin)`);

    // Delete the page's files from repo
    for (const filename of ["index.html", "labels.js"]) {
      try {
        await deleteFile(`${slug}/${filename}`, `Remove ${slug}/${filename}`);
      } catch { /* file might not exist */ }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
