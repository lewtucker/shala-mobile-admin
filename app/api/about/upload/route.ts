import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { commitFiles } from "@/lib/github";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing photo" }, { status: 400 });
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

    // Commit photo to photos/
    await commitFiles(
      [{ path: `photos/${filename}`, content: buffer }],
      `Add about photo ${filename} (mobile admin)`
    );

    return NextResponse.json({ ok: true, filename });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
