import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFileContent, commitFiles } from "@/lib/github";
import { parseContent, generateContent } from "@/lib/content-parser";
import { generateLabelsJs } from "@/lib/labels-generator";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, pageSlug } = await request.json();

    if (!filename || !pageSlug) {
      return NextResponse.json({ error: "filename and pageSlug required" }, { status: 400 });
    }

    // Read current state
    const { content: contentMd } = await getFileContent("CONTENT.md");
    const { content: metadataStr } = await getFileContent("photos/metadata.json");
    const metadata = JSON.parse(metadataStr);
    const siteContent = parseContent(contentMd);

    const page = siteContent.galleryPages.find((p) => p.slug === pageSlug);
    if (!page) {
      return NextResponse.json({ error: `Page ${pageSlug} not found` }, { status: 404 });
    }

    // Don't add if already on the page
    if (page.photos.includes(filename)) {
      return NextResponse.json({ ok: true, message: "Already on page" });
    }

    page.photos.push(filename);

    // Ensure metadata entry exists
    if (!metadata[filename]) {
      metadata[filename] = { title: "", desc: [], zoom: 1 };
    }

    // Build files to commit
    const files: { path: string; content: string }[] = [
      { path: "CONTENT.md", content: generateContent(siteContent) },
      { path: "photos/metadata.json", content: JSON.stringify(metadata, null, 2) + "\n" },
      { path: `${page.slug}/labels.js`, content: generateLabelsJs(page.photos, metadata) },
    ];

    await commitFiles(files, `Add ${filename} to ${page.name} (mobile admin)`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
