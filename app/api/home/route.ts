import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFileContent, commitFiles } from "@/lib/github";
import { parseHomeData, applyHomeData, HomeData } from "@/lib/html-parser";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content: html } = await getFileContent("index.html");
    const homeData = parseHomeData(html);
    return NextResponse.json(homeData);
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
    const data: HomeData = await request.json();
    const { content: html } = await getFileContent("index.html");
    const updatedHtml = applyHomeData(html, data);

    await commitFiles(
      [{ path: "index.html", content: updatedHtml }],
      "Update home page (mobile admin)"
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
