// Parse and update index.html and gallery page HTML via GitHub API
// Mirrors the regex logic from the desktop admin's server.js

export interface HomeData {
  title: string;
  subtitle: string;
  footer: string;
  ctaText: string;
  ctaHref: string;
  ctaColor: string;
  ctaFont: string;
  ctaSize: number;
  ctaWeight: string;
  ctaStyle: string;
  ctaVisible: boolean;
}

export interface DesignSettings {
  bgColor: string;
  textColor: string;
  titleFont: string;
  bodyFont: string;
  titleSize: number;
  bodySize: number;
  titleWeight: string;
  titleStyle: string;
  bodyWeight: string;
  bodyStyle: string;
  capTitleFont: string;
  capTitleSize: number;
  capTitleWeight: string;
  capTitleStyle: string;
  capDescFont: string;
  capDescSize: number;
  capDescWeight: string;
  capDescStyle: string;
  capAlign: string;
  subFont: string;
  subSize: number;
  subWeight: string;
  subStyle: string;
}

export function parseHomeData(html: string): HomeData {
  const title = (html.match(/<h1>([^<]*)<\/h1>/) || [])[1] || "";
  const subtitle =
    (html.match(/<header>[^]*?<p>([^<]*)<\/p>/) || [])[1] || "";
  const footer = (html.match(/<footer>([^<]*)<\/footer>/) || [])[1] || "";

  const ctaBlock = html.match(/<div id="cta"([^>]*)>([\s\S]*?)<\/div>/);
  const ctaVisible = ctaBlock ? !/display:none/.test(ctaBlock[1]) : false;
  const ctaAnchor = ctaBlock
    ? ctaBlock[2].match(/<a href="([^"]*)" style="([^"]*)">([\s\S]*?)<\/a>/)
    : null;
  const ctaHref = ctaAnchor ? ctaAnchor[1] : "";
  const ctaStyleStr = ctaAnchor ? ctaAnchor[2] : "";
  const ctaText = ctaAnchor ? ctaAnchor[3] : "";
  const ctaColor =
    (ctaStyleStr.match(/color:([^;]+)/) || [])[1] || "#888888";
  const ctaFont =
    (ctaStyleStr.match(/font-family:'([^']+)'/) || [])[1] ||
    "Cormorant Garamond";
  const ctaSize = parseFloat(
    (ctaStyleStr.match(/font-size:([0-9.]+)rem/) || [])[1] || "1"
  );
  const ctaWeight =
    (ctaStyleStr.match(/font-weight:(\w+)/) || [])[1] || "400";
  const ctaFontStyle =
    (ctaStyleStr.match(/font-style:(\w+)/) || [])[1] || "normal";

  return {
    title,
    subtitle,
    footer,
    ctaText,
    ctaHref,
    ctaColor,
    ctaFont,
    ctaSize,
    ctaWeight,
    ctaStyle: ctaFontStyle,
    ctaVisible,
  };
}

export function applyHomeData(html: string, data: HomeData): string {
  if (data.title !== undefined)
    html = html.replace(/(<h1>)[^<]*(<\/h1>)/, `$1${data.title}$2`);
  if (data.subtitle !== undefined)
    html = html.replace(
      /(<header>[^]*?<p>)[^<]*(<\/p>)/,
      `$1${data.subtitle}$2`
    );
  if (data.footer !== undefined)
    html = html.replace(/(<footer>)[^<]*(<\/footer>)/, `$1${data.footer}$2`);

  if (data.ctaText !== undefined) {
    const serifFonts = [
      "Cormorant Garamond",
      "Playfair Display",
      "Libre Baskerville",
      "Lora",
      "EB Garamond",
      "Merriweather",
    ];
    const fallback = serifFonts.includes(data.ctaFont) ? "serif" : "sans-serif";
    const display = data.ctaVisible ? "" : "display:none";
    const newCta = `<div id="cta"${display ? ` style="${display}"` : ""}><a href="${data.ctaHref || ""}" style="font-family:'${data.ctaFont}',${fallback};color:${data.ctaColor};font-size:${data.ctaSize}rem;font-weight:${data.ctaWeight || "400"};font-style:${data.ctaStyle || "normal"};letter-spacing:0.05em;text-decoration:none;transition:opacity 0.2s;">${data.ctaText}</a></div>`;
    html = html.replace(/<div id="cta"[^>]*>[\s\S]*?<\/div>/, newCta);
  }

  return html;
}

export function parseDesignSettings(
  homeHtml: string,
  galleryHtml: string
): DesignSettings {
  const m = (src: string, re: RegExp) => {
    const match = src.match(re);
    return match ? match[1] : null;
  };

  return {
    bgColor: m(homeHtml, /body\s*\{[^}]*background:\s*(#[a-fA-F0-9]{3,6})/) || "#ebebeb",
    textColor: m(homeHtml, /body\s*\{[^}]*\bcolor:\s*(#[a-fA-F0-9]{3,6})/) || "#222222",
    bodyFont: m(homeHtml, /body\s*\{[^}]*font-family:\s*'([^']+)'/) || "Montserrat",
    titleFont: m(homeHtml, /header h1\s*\{[^}]*font-family:\s*'([^']+)'/) || "Cormorant Garamond",
    titleSize: parseFloat(m(homeHtml, /header h1\s*\{[^}]*font-size:\s*([0-9.]+)rem/) || "3"),
    bodySize: parseInt(m(homeHtml, /body\s*\{[^}]*font-size:\s*([0-9.]+)px/) || "14"),
    titleWeight: m(homeHtml, /header h1\s*\{[^}]*font-weight:\s*(\w+)/) || "300",
    titleStyle: m(homeHtml, /header h1\s*\{[^}]*font-style:\s*(\w+)/) || "normal",
    bodyWeight: m(homeHtml, /body\s*\{[^}]*font-weight:\s*(\w+)/) || "300",
    bodyStyle: m(homeHtml, /body\s*\{[^}]*font-style:\s*(\w+)/) || "normal",
    capTitleFont: m(galleryHtml, /\.caption \.title\s*\{[^}]*font-family:\s*'([^']+)'/) || "Cormorant Garamond",
    capTitleSize: parseFloat(m(galleryHtml, /\.caption \.title\s*\{[^}]*font-size:\s*([0-9.]+)rem/) || "1.2"),
    capTitleWeight: m(galleryHtml, /\.caption \.title\s*\{[^}]*font-weight:\s*(\w+)/) || "400",
    capTitleStyle: m(galleryHtml, /\.caption \.title\s*\{[^}]*font-style:\s*(\w+)/) || "normal",
    capDescFont: m(galleryHtml, /\.caption \.desc\s*\{[^}]*font-family:\s*'([^']+)'/) || "Montserrat",
    capDescSize: parseFloat(m(galleryHtml, /\.caption \.desc\s*\{[^}]*font-size:\s*([0-9.]+)rem/) || "0.75"),
    capDescWeight: m(galleryHtml, /\.caption \.desc\s*\{[^}]*font-weight:\s*(\w+)/) || "300",
    capDescStyle: m(galleryHtml, /\.caption \.desc\s*\{[^}]*font-style:\s*(\w+)/) || "italic",
    capAlign: m(galleryHtml, /\.caption\s*\{[^}]*text-align:\s*(\w+)/) || "center",
    subFont: m(homeHtml, /header p\s*\{[^}]*font-family:\s*'([^']+)'/) || "Montserrat",
    subSize: parseFloat(m(homeHtml, /header p\s*\{[^}]*font-size:\s*([0-9.]+)rem/) || "0.7"),
    subWeight: m(homeHtml, /header p\s*\{[^}]*font-weight:\s*(\w+)/) || "400",
    subStyle: m(homeHtml, /header p\s*\{[^}]*font-style:\s*(\w+)/) || "normal",
  };
}

// Apply design settings to an HTML string (works for both home and gallery pages)
export function applyDesignSettings(html: string, s: DesignSettings, isGalleryPage: boolean): string {
  // Background & text color
  html = html.replace(/(body\s*\{[^}]*)background:\s*#[a-fA-F0-9]{3,6}/, `$1background: ${s.bgColor}`);
  html = html.replace(/(body\s*\{[^}]*)\bcolor:\s*#[a-fA-F0-9]{3,6}/, `$1color: ${s.textColor}`);

  // Body font
  const serifFonts = ["Cormorant Garamond", "Playfair Display", "Libre Baskerville", "Lora", "EB Garamond", "Merriweather"];
  const bodyFallback = serifFonts.includes(s.bodyFont) ? "serif" : "sans-serif";
  html = html.replace(/(body\s*\{[^}]*)font-family:\s*'[^']+',\s*\w+-?\w*/, `$1font-family: '${s.bodyFont}', ${bodyFallback}`);
  html = html.replace(/(body\s*\{[^}]*)font-size:\s*[0-9.]+px/, `$1font-size: ${s.bodySize}px`);
  html = html.replace(/(body\s*\{[^}]*)font-weight:\s*\w+/, `$1font-weight: ${s.bodyWeight}`);

  // Title font
  const titleFallback = serifFonts.includes(s.titleFont) ? "serif" : "sans-serif";
  html = html.replace(/(header h1\s*\{[^}]*)font-family:\s*'[^']+',\s*\w+-?\w*/, `$1font-family: '${s.titleFont}', ${titleFallback}`);
  html = html.replace(/(header h1\s*\{[^}]*)font-size:\s*[0-9.]+rem/, `$1font-size: ${s.titleSize}rem`);
  html = html.replace(/(header h1\s*\{[^}]*)font-weight:\s*\w+/, `$1font-weight: ${s.titleWeight}`);

  // Subtitle font
  const subFallback = serifFonts.includes(s.subFont) ? "serif" : "sans-serif";
  if (html.match(/header p\s*\{[^}]*font-family:/)) {
    html = html.replace(/(header p\s*\{[^}]*)font-family:\s*'[^']+',\s*\w+-?\w*/, `$1font-family: '${s.subFont}', ${subFallback}`);
  }
  if (html.match(/header p\s*\{[^}]*font-size:/)) {
    html = html.replace(/(header p\s*\{[^}]*)font-size:\s*[0-9.]+rem/, `$1font-size: ${s.subSize}rem`);
  }
  if (html.match(/header p\s*\{[^}]*font-weight:/)) {
    html = html.replace(/(header p\s*\{[^}]*)font-weight:\s*\w+/, `$1font-weight: ${s.subWeight}`);
  }

  // Caption styles (gallery pages only)
  if (isGalleryPage) {
    const capTitleFallback = serifFonts.includes(s.capTitleFont) ? "serif" : "sans-serif";
    html = html.replace(/(\.caption \.title\s*\{[^}]*)font-family:\s*'[^']+',\s*\w+/, `$1font-family: '${s.capTitleFont}', ${capTitleFallback}`);
    html = html.replace(/(\.caption \.title\s*\{[^}]*)font-size:\s*[0-9.]+rem/, `$1font-size: ${s.capTitleSize}rem`);
    html = html.replace(/(\.caption \.title\s*\{[^}]*)font-weight:\s*\w+/, `$1font-weight: ${s.capTitleWeight}`);

    const capDescFallback = serifFonts.includes(s.capDescFont) ? "serif" : "sans-serif";
    if (html.match(/\.caption \.desc\s*\{[^}]*font-family:/)) {
      html = html.replace(/(\.caption \.desc\s*\{[^}]*)font-family:\s*'[^']+',\s*\w+/, `$1font-family: '${s.capDescFont}', ${capDescFallback}`);
    }
    html = html.replace(/(\.caption \.desc\s*\{[^}]*)font-size:\s*[0-9.]+rem/, `$1font-size: ${s.capDescSize}rem`);

    // Caption alignment
    html = html.replace(/(\.caption\s*\{[^}]*)text-align:\s*\w+/, `$1text-align: ${s.capAlign}`);
  }

  return html;
}
