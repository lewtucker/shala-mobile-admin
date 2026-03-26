// Rebuild nav on all HTML pages (home, gallery pages, library, about)
// Mirrors the updateNav() function from the desktop admin

import { getFileContent } from "./github";

interface PageInfo {
  slug: string;
  name: string;
  hidden?: boolean;
}

export async function buildNavUpdates(
  pages: PageInfo[],
  aboutTitle: string
): Promise<{ path: string; content: string }[]> {
  const visiblePages = pages.filter((p) => !p.hidden);
  const files: { path: string; content: string }[] = [];

  // Update home index.html
  const { content: homeHtml } = await getFileContent("index.html");
  const homeNavLinks = [
    ...visiblePages.map((p) => `  <a href="${p.slug}/">${p.name}</a>`),
    `  <a href="about/">${aboutTitle}</a>`,
  ].join("\n");
  const homeGalleryLinks = visiblePages
    .map((p) => `  <a class="gallery-link" href="${p.slug}/">${p.name}</a>`)
    .join("\n");

  let updatedHome = homeHtml.replace(
    /(<nav>)([\s\S]*?)(<\/nav>)/,
    `$1\n${homeNavLinks}\n$3`
  );
  updatedHome = updatedHome.replace(
    /(<div class="gallery-list">)([\s\S]*?)(<\/div>)/,
    `$1\n${homeGalleryLinks}\n$3`
  );
  files.push({ path: "index.html", content: updatedHome });

  // Update each gallery page's nav
  for (const p of pages) {
    try {
      const { content: pageHtml } = await getFileContent(`${p.slug}/index.html`);
      const galleryNavLinks = [
        `  <a href="../">Home</a>`,
        ...visiblePages.map(
          (q) =>
            `  <a href="../${q.slug}/"${q.slug === p.slug ? ' class="active"' : ""}>${q.name}</a>`
        ),
        `  <a href="../about/">${aboutTitle}</a>`,
      ].join("\n");
      const updated = pageHtml.replace(
        /(<nav>)([\s\S]*?)(<\/nav>)/,
        `$1\n${galleryNavLinks}\n$3`
      );
      files.push({ path: `${p.slug}/index.html`, content: updated });
    } catch {
      continue;
    }
  }

  // Update library nav
  try {
    const { content: libHtml } = await getFileContent("library/index.html");
    const libNavLinks = [
      `  <a href="../">Home</a>`,
      ...visiblePages.map((q) => `  <a href="../${q.slug}/">${q.name}</a>`),
      `  <a href="../about/">${aboutTitle}</a>`,
    ].join("\n");
    const updatedLib = libHtml.replace(
      /(<nav>)([\s\S]*?)(<\/nav>)/,
      `$1\n${libNavLinks}\n$3`
    );
    files.push({ path: "library/index.html", content: updatedLib });
  } catch { /* library might not exist */ }

  // Update about nav
  try {
    const { content: aboutHtml } = await getFileContent("about/index.html");
    const aboutNavLinks = [
      `  <a href="../">Home</a>`,
      ...visiblePages.map((q) => `  <a href="../${q.slug}/">${q.name}</a>`),
      `  <a href="../about/" class="active">${aboutTitle}</a>`,
    ].join("\n");
    const updatedAbout = aboutHtml.replace(
      /(<nav>)([\s\S]*?)(<\/nav>)/,
      `$1\n${aboutNavLinks}\n$3`
    );
    files.push({ path: "about/index.html", content: updatedAbout });
  } catch { /* about might not exist */ }

  return files;
}
