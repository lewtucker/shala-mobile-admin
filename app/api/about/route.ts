import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFileContent, commitFiles } from "@/lib/github";

interface AboutData {
  photo: string;
  title: string;
  bio: string;
  buttonText: string;
}

function parseAboutJs(content: string): AboutData {
  const photoM = content.match(/photo:\s*"([^"]*)"/);
  const titleM = content.match(/title:\s*"([^"]*)"/);
  const buttonM = content.match(/buttonText:\s*"([^"]*)"/);
  // Bio uses \n for newlines inside the string
  const bioM = content.match(/bio:\s*"((?:[^"\\]|\\.)*)"/);

  return {
    photo: photoM ? photoM[1] : "",
    title: titleM ? titleM[1] : "About the Artist",
    bio: bioM ? bioM[1].replace(/\\n/g, "\n") : "",
    buttonText: buttonM ? buttonM[1] : "Explore my Gallery",
  };
}

function generateAboutJs(data: AboutData): string {
  const escapedBio = data.bio.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  return `// About page data — edit via admin UI or directly here.

const ABOUT = {
  photo: "${data.photo}",
  title: "${data.title}",
  bio: "${escapedBio}",
  buttonText: "${data.buttonText}"
};
`;
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content } = await getFileContent("about/about.js");
    const aboutData = parseAboutJs(content);
    return NextResponse.json(aboutData);
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
    const data: AboutData = await request.json();
    const files: { path: string; content: string }[] = [];

    // Update about.js
    files.push({ path: "about/about.js", content: generateAboutJs(data) });

    // Update <h1> and <title> in about/index.html
    const { content: aboutHtml } = await getFileContent("about/index.html");
    let updatedHtml = aboutHtml;
    updatedHtml = updatedHtml.replace(/(<h1[^>]*>)[^<]*(<\/h1>)/, `$1${data.title}$2`);
    updatedHtml = updatedHtml.replace(/(<title>)[^<]*(<\/title>)/, `$1${data.title}$2`);
    files.push({ path: "about/index.html", content: updatedHtml });

    await commitFiles(files, "Update about page (mobile admin)");

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
