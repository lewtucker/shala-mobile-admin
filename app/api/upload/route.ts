import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { commitFiles, getFileContent } from "@/lib/github";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;
    const pageSlug = formData.get("pageSlug") as string | null;

    if (!file || !pageSlug) {
      return NextResponse.json({ error: "Missing photo or pageSlug" }, { status: 400 });
    }

    let filename = file.name;
    const arrayBuf = await file.arrayBuffer();
    let buffer: Buffer<ArrayBuffer> = Buffer.from(arrayBuf) as Buffer<ArrayBuffer>;

    // Convert HEIC to JPEG using heic-convert (sharp doesn't support HEIC)
    if (filename.toLowerCase().endsWith(".heic") || filename.toLowerCase().endsWith(".heif")) {
      const heicConvert = (await import("heic-convert")).default;
      const converted = await heicConvert({ buffer, format: "JPEG", quality: 0.92 });
      buffer = Buffer.from(converted) as Buffer<ArrayBuffer>;
      filename = filename.replace(/\.heic$/i, ".jpeg").replace(/\.heif$/i, ".jpeg");
    }

    // Read current CONTENT.md and metadata
    const { content: contentMd } = await getFileContent("CONTENT.md");
    const { content: metadataStr } = await getFileContent("photos/metadata.json");
    const metadata = JSON.parse(metadataStr);

    // Add metadata entry for new photo
    metadata[filename] = { title: "", desc: [], zoom: 1 };

    // Add photo to the page's section in CONTENT.md
    // Find the page section and append the photo
    const { parseContent, generateContent } = await import("@/lib/content-parser");
    const { generateLabelsJs } = await import("@/lib/labels-generator");

    const siteContent = parseContent(contentMd);
    const page = siteContent.galleryPages.find((p) => p.slug === pageSlug);
    if (!page) {
      return NextResponse.json({ error: `Page ${pageSlug} not found` }, { status: 404 });
    }
    page.photos.push(filename);

    // Also add to "all" page if it exists and isn't the target
    if (pageSlug !== "all") {
      const allPage = siteContent.galleryPages.find((p) => p.slug === "all");
      if (allPage) {
        allPage.photos.push(filename);
      }
    }

    // Build files to commit
    const files: { path: string; content: string | Buffer }[] = [
      { path: `photos/${filename}`, content: buffer },
      { path: "CONTENT.md", content: generateContent(siteContent) },
      { path: "photos/metadata.json", content: JSON.stringify(metadata, null, 2) + "\n" },
    ];

    // Regenerate labels.js for affected pages
    for (const p of siteContent.galleryPages) {
      if (p.slug === pageSlug || p.slug === "all") {
        files.push({ path: `${p.slug}/labels.js`, content: generateLabelsJs(p.photos, metadata) });
      }
    }

    await commitFiles(files, `Add ${filename} to ${page.name} (mobile admin)`);

    return NextResponse.json({ ok: true, filename });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
