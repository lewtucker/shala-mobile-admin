// Parse and generate CONTENT.md

export interface PageInfo {
  slug: string;       // e.g. "page-2"
  name: string;       // e.g. "Paintings"
  url: string;        // e.g. "https://shalaball.com/page-2/"
  hidden?: boolean;
  photos: string[];   // ordered filenames
}

export interface SiteContent {
  pages: PageInfo[];  // from the Pages table
  galleryPages: PageInfo[]; // individual page sections with photo lists
}

export function parseContent(markdown: string): SiteContent {
  const pages: PageInfo[] = [];
  const galleryPages: PageInfo[] = [];

  const sections = markdown.split(/\n---\n/);

  // Parse the Pages table (first section after header)
  for (const section of sections) {
    const pagesMatch = section.match(/## Pages\s*\n\n\|[^\n]+\|\s*\n\|[-|\s]+\|\s*\n([\s\S]*?)$/);
    if (pagesMatch) {
      const rows = pagesMatch[1].trim().split("\n");
      for (const row of rows) {
        const cols = row.split("|").slice(1, -1).map(c => c.trim());
        if (cols.length >= 3) {
          const urlMatch = cols[2].match(/shalaball\.com\/([\w-]+)\//);
          if (urlMatch) {
            pages.push({
              slug: urlMatch[1],
              name: cols[1],
              url: cols[2],
              photos: [],
            });
          } else if (cols[2].includes("shalaball.com/")) {
            // Home page
            pages.push({
              slug: "home",
              name: cols[1],
              url: cols[2],
              photos: [],
            });
          }
        }
      }
    }
  }

  // Parse individual page sections
  for (const section of sections) {
    const pageMatch = section.match(/## (.+?) Page \(`([\w-]+)\/`\)/);
    if (!pageMatch) continue;

    const name = pageMatch[1];
    const slug = pageMatch[2];
    const hidden = /Hidden:\s*true/i.test(section);

    const photos: string[] = [];
    const tableMatch = section.match(/\| Order \| Filename \|\s*\n\|[-|\s]+\|\s*\n([\s\S]*?)$/);
    if (tableMatch) {
      const rows = tableMatch[1].trim().split("\n");
      for (const row of rows) {
        const cols = row.split("|").slice(1, -1).map(c => c.trim());
        if (cols.length >= 2 && cols[1]) {
          photos.push(cols[1]);
        }
      }
    }

    galleryPages.push({ slug, name, url: `https://shalaball.com/${slug}/`, hidden, photos });
  }

  return { pages, galleryPages };
}

export function generateContent(content: SiteContent): string {
  let md = `# Site Content

> Source of truth for page photo order.
> Photo titles, descriptions, and zoom are stored in photos/metadata.json.

---

## Pages

| Page | Name | URL |
|------|------|-----|
`;

  for (const p of content.pages) {
    md += `| ${p.name} | ${p.name} | ${p.url} |\n`;
  }

  for (const page of content.galleryPages) {
    md += `\n---\n\n## ${page.name} Page (\`${page.slug}/\`)\n\n`;
    if (page.hidden) {
      md += "Hidden: true\n\n";
    }
    md += "| Order | Filename |\n|-------|----------|\n";
    page.photos.forEach((photo, i) => {
      md += `| ${i + 1} | ${photo} |\n`;
    });
  }

  return md;
}
