import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFileContent, commitFiles } from "@/lib/github";
import { parseContent } from "@/lib/content-parser";
import { generateLabelsJs } from "@/lib/labels-generator";

// Save metadata (title, desc, zoom) for one or more photos
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // updates: { [filename]: { title, desc, zoom } }
    const updates: Record<string, { title: string; desc: string[]; zoom: number }> =
      await request.json();

    const { content: metadataStr } = await getFileContent("photos/metadata.json");
    const metadata = JSON.parse(metadataStr);

    // Apply updates
    for (const [filename, data] of Object.entries(updates)) {
      metadata[filename] = {
        title: data.title || "",
        desc: Array.isArray(data.desc) ? data.desc.filter((s) => s.trim()) : [],
        zoom: typeof data.zoom === "number" ? data.zoom : 1,
      };
    }

    // Rebuild all labels.js files so changes reflect on every page
    const { content: contentMd } = await getFileContent("CONTENT.md");
    const siteContent = parseContent(contentMd);

    const files: { path: string; content: string }[] = [
      { path: "photos/metadata.json", content: JSON.stringify(metadata, null, 2) + "\n" },
    ];

    for (const page of siteContent.galleryPages) {
      files.push({
        path: `${page.slug}/labels.js`,
        content: generateLabelsJs(page.photos, metadata),
      });
    }

    await commitFiles(files, "Update photo metadata (mobile admin)");

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
