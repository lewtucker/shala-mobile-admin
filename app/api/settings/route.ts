import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFileContent, commitFiles } from "@/lib/github";
import {
  parseDesignSettings,
  applyDesignSettings,
  DesignSettings,
} from "@/lib/html-parser";

const GALLERY_PAGES = ["page-2", "page-1", "page-3", "all", "library", "cards"];

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content: homeHtml } = await getFileContent("index.html");

    // Find a gallery page to read caption styles from
    let galleryHtml = "";
    for (const dir of GALLERY_PAGES) {
      try {
        const { content } = await getFileContent(`${dir}/index.html`);
        galleryHtml = content;
        break;
      } catch {
        continue;
      }
    }

    const settings = parseDesignSettings(homeHtml, galleryHtml);
    return NextResponse.json(settings);
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
    const settings: DesignSettings = await request.json();

    // Update index.html
    const { content: homeHtml } = await getFileContent("index.html");
    const updatedHome = applyDesignSettings(homeHtml, settings, false);

    const files: { path: string; content: string }[] = [
      { path: "index.html", content: updatedHome },
    ];

    // Update all gallery pages
    for (const dir of GALLERY_PAGES) {
      try {
        const { content: pageHtml } = await getFileContent(`${dir}/index.html`);
        const updatedPage = applyDesignSettings(pageHtml, settings, true);
        files.push({ path: `${dir}/index.html`, content: updatedPage });
      } catch {
        continue; // page might not exist
      }
    }

    await commitFiles(files, "Update design settings (mobile admin)");

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
