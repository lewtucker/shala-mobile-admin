import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFileContent, commitFiles } from "@/lib/github";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, direction } = await request.json();
    // direction: "cw" (clockwise 90) or "ccw" (counter-clockwise 90)

    if (!filename || !direction) {
      return NextResponse.json({ error: "filename and direction required" }, { status: 400 });
    }

    // Download the image from GitHub
    const { Octokit } = await import("octokit");
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const { data } = await octokit.rest.repos.getContent({
      owner: "shalaball",
      repo: "art-gallery",
      path: `photos/${filename}`,
    });

    if (Array.isArray(data) || data.type !== "file" || !data.content) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const imageBuffer = Buffer.from(data.content, "base64");

    // Rotate with sharp
    const sharp = (await import("sharp")).default;
    const angle = direction === "cw" ? 90 : -90;
    const rotated = await sharp(imageBuffer).rotate(angle).toBuffer();

    // Commit rotated image back
    await commitFiles(
      [{ path: `photos/${filename}`, content: rotated }],
      `Rotate ${filename} ${direction === "cw" ? "clockwise" : "counter-clockwise"} (mobile admin)`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
