import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { commitFiles, getFileContent, deleteFile } from "@/lib/github";
import { parseContent, generateContent } from "@/lib/content-parser";
import { generateLabelsJs } from "@/lib/labels-generator";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, pageSlug } = await request.json();

    if (!filename || !pageSlug) {
      return NextResponse.json({ error: "Missing filename or pageSlug" }, { status: 400 });
    }

    // Read current state
    const { content: contentMd } = await getFileContent("CONTENT.md");
    const { content: metadataStr } = await getFileContent("photos/metadata.json");
    const metadata = JSON.parse(metadataStr);
    const siteContent = parseContent(contentMd);

    // Remove photo from the specified page
    const page = siteContent.galleryPages.find((p) => p.slug === pageSlug);
    if (page) {
      page.photos = page.photos.filter((p) => p !== filename);
    }

    // Check if photo is still used on any other page
    const stillUsed = siteContent.galleryPages.some((p) => p.photos.includes(filename));

    // Build files to commit
    const files: { path: string; content: string }[] = [
      { path: "CONTENT.md", content: generateContent(siteContent) },
    ];

    // Regenerate labels.js for affected page
    if (page) {
      files.push({
        path: `${page.slug}/labels.js`,
        content: generateLabelsJs(page.photos, metadata),
      });
    }

    // If not used anywhere, remove metadata entry
    if (!stillUsed) {
      delete metadata[filename];
      files.push({
        path: "photos/metadata.json",
        content: JSON.stringify(metadata, null, 2) + "\n",
      });
    }

    await commitFiles(files, `Remove ${filename} from ${page?.name || pageSlug} (mobile admin)`);

    // Delete the actual photo file if not used anywhere
    if (!stillUsed) {
      try {
        await deleteFile(`photos/${filename}`, `Delete unused photo ${filename} (mobile admin)`);
      } catch {
        // Photo file might not exist, that's ok
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
