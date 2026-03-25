// Generate labels.js from page photos + metadata

export interface PhotoMetadata {
  [filename: string]: {
    title: string;
    desc: string | string[];
    zoom?: number;
  };
}

export function generateLabelsJs(
  photos: string[],
  metadata: PhotoMetadata
): string {
  const entries = photos.map((filename) => {
    const meta = metadata[filename] || { title: "", desc: [] };
    const title = meta.title || "";
    const desc = Array.isArray(meta.desc) ? meta.desc : meta.desc ? [meta.desc] : [];
    const zoom = meta.zoom && meta.zoom !== 1 ? meta.zoom : undefined;

    const descStr = JSON.stringify(desc);
    const zoomStr = zoom ? `, zoom: ${zoom}` : "";
    return `  { filename: ${JSON.stringify(filename)}, title: ${JSON.stringify(title)}, desc: ${descStr}${zoomStr} }`;
  });

  return `// Auto-generated — do not edit directly.\n\nconst LABELS = [\n${entries.join(",\n")},\n];\n`;
}
