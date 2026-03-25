import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFileContent, commitFiles } from "@/lib/github";
import { parseContent, generateContent, SiteContent } from "@/lib/content-parser";
import { generateLabelsJs, PhotoMetadata } from "@/lib/labels-generator";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content: contentMd } = await getFileContent("CONTENT.md");
    const { content: metadataJson } = await getFileContent("photos/metadata.json");
    const siteContent = parseContent(contentMd);
    const metadata = JSON.parse(metadataJson);

    return NextResponse.json({ siteContent, metadata });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { siteContent, metadata }: { siteContent: SiteContent; metadata: PhotoMetadata } =
      await request.json();

    // Generate all files to commit
    const files: { path: string; content: string }[] = [];

    // 1. CONTENT.md
    files.push({ path: "CONTENT.md", content: generateContent(siteContent) });

    // 2. metadata.json
    files.push({
      path: "photos/metadata.json",
      content: JSON.stringify(metadata, null, 2) + "\n",
    });

    // 3. labels.js for each gallery page
    for (const page of siteContent.galleryPages) {
      const labelsJs = generateLabelsJs(page.photos, metadata);
      files.push({ path: `${page.slug}/labels.js`, content: labelsJs });
    }

    await commitFiles(files, "Update gallery content (mobile admin)");

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
