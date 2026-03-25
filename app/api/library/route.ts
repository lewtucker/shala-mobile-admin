import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFileContent } from "@/lib/github";
import { parseContent } from "@/lib/content-parser";

interface LibraryPhoto {
  filename: string;
  pages: string[]; // page slugs that reference this photo
  title: string;
  desc: string[];
  zoom: number;
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get list of all files in photos/ directory via GitHub API
    const { Octokit } = await import("octokit");
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const { data: dirContents } = await octokit.rest.repos.getContent({
      owner: "shalaball",
      repo: "art-gallery",
      path: "photos",
    });

    if (!Array.isArray(dirContents)) {
      return NextResponse.json({ error: "photos/ is not a directory" }, { status: 500 });
    }

    const photoFiles = dirContents
      .filter((f) => f.type === "file" && /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(f.name))
      .map((f) => f.name);

    // Get CONTENT.md to build page map
    const { content: contentMd } = await getFileContent("CONTENT.md");
    const siteContent = parseContent(contentMd);

    const pageMap: Record<string, string[]> = {};
    for (const page of siteContent.galleryPages) {
      for (const photo of page.photos) {
        if (!pageMap[photo]) pageMap[photo] = [];
        pageMap[photo].push(page.slug);
      }
    }

    // Get metadata
    const { content: metadataStr } = await getFileContent("photos/metadata.json");
    const metadata = JSON.parse(metadataStr);

    const library: LibraryPhoto[] = photoFiles.map((filename) => {
      const meta = metadata[filename] || {};
      return {
        filename,
        pages: pageMap[filename] || [],
        title: meta.title || "",
        desc: Array.isArray(meta.desc) ? meta.desc : meta.desc ? [meta.desc] : [],
        zoom: meta.zoom || 1,
      };
    });

    return NextResponse.json(library);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
