/**
 * Generates a PNG preview thumbnail for every template in data/templatesData.js.
 *
 * Each image is written to the exact path stored on the template's `previewImage`
 * field (e.g. "/templates/china-executive-001.png" -> public/templates/china-executive-001.png),
 * and server.js serves `public/` statically so the URLs resolve as-is.
 *
 * Colors are derived from each template's own `styling` config, so a preview
 * always matches the template it represents. PNGs are encoded with Node's
 * built-in zlib, so there is no native image dependency to install.
 *
 * Usage: npm run previews
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { templateData } from "../data/templatesData.js";

/* ------------------------------------------------------------------ *
 * Minimal PNG encoder (RGB, 8-bit, no interlacing)
 * ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

class Canvas {
  constructor(width, height, background) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 3);
    this.rect(0, 0, width, height, background);
  }

  #offset(x, y) {
    return (y * this.width + x) * 3;
  }

  #eachPixel(x, y, w, h, visit) {
    const x0 = clamp(Math.round(x), 0, this.width);
    const y0 = clamp(Math.round(y), 0, this.height);
    const x1 = clamp(Math.round(x + w), 0, this.width);
    const y1 = clamp(Math.round(y + h), 0, this.height);

    for (let py = y0; py < y1; py += 1) {
      for (let px = x0; px < x1; px += 1) {
        visit(px, py, this.#offset(px, py));
      }
    }
  }

  /** Solid fill. */
  rect(x, y, w, h, color) {
    const [r, g, b] = hexToRgb(color);
    this.#eachPixel(x, y, w, h, (_px, _py, i) => {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
    });
    return this;
  }

  /** Left-to-right linear gradient. */
  gradient(x, y, w, h, fromColor, toColor) {
    const from = hexToRgb(fromColor);
    const to = hexToRgb(toColor);
    this.#eachPixel(x, y, w, h, (px, _py, i) => {
      const t = w <= 1 ? 0 : (px - x) / (w - 1);
      this.data[i] = Math.round(from[0] + (to[0] - from[0]) * t);
      this.data[i + 1] = Math.round(from[1] + (to[1] - from[1]) * t);
      this.data[i + 2] = Math.round(from[2] + (to[2] - from[2]) * t);
    });
    return this;
  }

  /**
   * Alpha-blended fill with optional corner radius. Blending against the
   * existing pixels keeps bars legible over both solid and gradient headers.
   */
  bar(x, y, w, h, color, alpha = 1, radius = 0) {
    const [r, g, b] = hexToRgb(color);
    const rad = Math.min(radius, Math.floor(w / 2), Math.floor(h / 2));
    const left = Math.round(x);
    const top = Math.round(y);
    const right = left + Math.round(w) - 1;
    const bottom = top + Math.round(h) - 1;

    const outsideCorner = (px, py) => {
      if (rad <= 0) return false;
      const cx = px < left + rad ? left + rad : px > right - rad ? right - rad : px;
      const cy = py < top + rad ? top + rad : py > bottom - rad ? bottom - rad : py;
      if (cx === px && cy === py) return false;
      return (px - cx) ** 2 + (py - cy) ** 2 > rad ** 2;
    };

    this.#eachPixel(x, y, w, h, (px, py, i) => {
      if (outsideCorner(px, py)) return;
      this.data[i] = Math.round(this.data[i] * (1 - alpha) + r * alpha);
      this.data[i + 1] = Math.round(this.data[i + 1] * (1 - alpha) + g * alpha);
      this.data[i + 2] = Math.round(this.data[i + 2] * (1 - alpha) + b * alpha);
    });
    return this;
  }

  toPng() {
    // Each scanline is prefixed with filter byte 0 (None).
    const stride = this.width * 3;
    const raw = Buffer.alloc((stride + 1) * this.height);
    for (let y = 0; y < this.height; y += 1) {
      raw[y * (stride + 1)] = 0;
      this.data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // color type: truecolor RGB
    ihdr[10] = 0; // deflate
    ihdr[11] = 0; // adaptive filtering
    ihdr[12] = 0; // no interlace

    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk("IHDR", ihdr),
      pngChunk("IDAT", deflateSync(raw, { level: 9 })),
      pngChunk("IEND", Buffer.alloc(0)),
    ]);
  }
}

/* ------------------------------------------------------------------ *
 * Palettes resolved from each template's Tailwind styling classes
 * ------------------------------------------------------------------ */

const PALETTES = {
  "china-executive-001": {
    canvas: "#FFFFFF", header: ["#111827"], accent: "#111827",
    badge: "#E5E7EB", badgeInk: "#4B5563",
  },
  "china-tech-002": {
    canvas: "#F5F6FF", header: ["#2563EB", "#9333EA"], accent: "#3B82F6",
    badge: "#DBEAFE", badgeInk: "#1E40AF",
  },
  "china-corporate-003": {
    canvas: "#FFFFFF", header: ["#1E40AF"], accent: "#2563EB",
    badge: "#EFF6FF", badgeInk: "#1D4ED8",
  },
  "china-creative-004": {
    canvas: "#FFFFFF", header: ["#EC4899", "#FB923C"], accent: "#EC4899",
    badge: "#FCE7F3", badgeInk: "#BE185D",
  },
  "china-finance-005": {
    canvas: "#F9FAFB", header: ["#166534"], accent: "#15803D",
    badge: "#DCFCE7", badgeInk: "#166534",
  },
  "china-academic-006": {
    canvas: "#FFFFFF", header: ["#7F1D1D"], accent: "#991B1B",
    badge: "#FEF2F2", badgeInk: "#991B1B",
  },
  "china-sales-007": {
    canvas: "#FFFFFF", header: ["#EA580C", "#DC2626"], accent: "#F97316",
    badge: "#FFEDD5", badgeInk: "#C2410C",
  },
  "china-minimal-008": {
    canvas: "#FFFFFF", header: ["#F9FAFB"], accent: "#111827",
    badge: "#F3F4F6", badgeInk: "#6B7280",
    lightHeader: true, headerRule: "#111827",
  },
  "china-healthcare-009": {
    canvas: "#FFFFFF", header: ["#0F766E"], accent: "#0D9488",
    badge: "#F0FDFA", badgeInk: "#115E59",
  },
  "china-legal-010": {
    canvas: "#FFFFFF", header: ["#1E3A8A"], accent: "#1E40AF",
    badge: "#EFF6FF", badgeInk: "#1E3A8A",
  },
};

const FALLBACK_PALETTE = {
  canvas: "#FFFFFF", header: ["#374151"], accent: "#6B7280",
  badge: "#F3F4F6", badgeInk: "#6B7280",
};

/* ------------------------------------------------------------------ *
 * Thumbnail layout (A4-ish 3:4 aspect)
 * ------------------------------------------------------------------ */

const WIDTH = 420;
const HEIGHT = 560;
const MARGIN = 28;
const CONTENT = WIDTH - MARGIN * 2;
const HEADER_H = 118;

const INK_HEADING = "#374151";
const INK_LINE = "#D1D5DB";

const renderPreview = (palette) => {
  const canvas = new Canvas(WIDTH, HEIGHT, palette.canvas);
  const [headerFrom, headerTo] = palette.header;

  // Header band
  if (headerTo) {
    canvas.gradient(0, 0, WIDTH, HEADER_H, headerFrom, headerTo);
  } else {
    canvas.rect(0, 0, WIDTH, HEADER_H, headerFrom);
  }
  if (palette.headerRule) {
    canvas.rect(0, HEADER_H - 3, WIDTH, 3, palette.headerRule);
  }

  // Name / role / contact, blended so it reads on any header
  const headerInk = palette.lightHeader ? "#111827" : "#FFFFFF";
  canvas.bar(MARGIN, 36, 214, 21, headerInk, palette.lightHeader ? 0.85 : 0.94, 3);
  canvas.bar(MARGIN, 66, 152, 11, headerInk, palette.lightHeader ? 0.55 : 0.7, 2);
  canvas.bar(MARGIN, 88, 196, 7, headerInk, palette.lightHeader ? 0.35 : 0.5, 2);

  // A section is a heading bar, an accent rule, then content lines.
  const section = (top, headingWidth, lineWidths) => {
    canvas.bar(MARGIN, top, headingWidth, 10, INK_HEADING, 0.9, 2);
    canvas.rect(MARGIN, top + 16, CONTENT, 2, palette.accent);
    lineWidths.forEach((width, index) => {
      canvas.bar(MARGIN, top + 28 + index * 12, width, 6, INK_LINE, 1, 2);
    });
  };

  section(146, 104, [CONTENT, CONTENT - 22, CONTENT - 68]);
  section(224, 122, [CONTENT, CONTENT - 26, CONTENT - 10, CONTENT - 76]);

  // Skills: heading, rule, then two rows of badges
  canvas.bar(MARGIN, 316, 76, 10, INK_HEADING, 0.9, 2);
  canvas.rect(MARGIN, 332, CONTENT, 2, palette.accent);

  const badgeW = 62;
  const badgeH = 18;
  const badgeGap = 13;
  const drawBadgeRow = (top, count) => {
    for (let i = 0; i < count; i += 1) {
      const x = MARGIN + i * (badgeW + badgeGap);
      canvas.bar(x, top, badgeW, badgeH, palette.badge, 1, 6);
      canvas.bar(x + 10, top + 7, badgeW - 20, 4, palette.badgeInk, 0.65, 2);
    }
  };
  drawBadgeRow(344, 5);
  drawBadgeRow(370, 4);

  section(408, 96, [CONTENT, CONTENT - 34, CONTENT - 84]);

  return canvas.toPng();
};

/* ------------------------------------------------------------------ *
 * Write one file per template
 * ------------------------------------------------------------------ */

const generate = () => {
  const publicDir = path.join(import.meta.dirname, "..", "public");
  let written = 0;
  const skipped = [];

  for (const template of templateData) {
    if (!template.previewImage) {
      skipped.push(`${template.id} (no previewImage field)`);
      continue;
    }

    // Mirror previewImage exactly so the stored path always resolves.
    const relative = template.previewImage.replace(/^\/+/, "");
    const target = path.join(publicDir, relative);
    mkdirSync(path.dirname(target), { recursive: true });

    const palette = PALETTES[template.id] ?? FALLBACK_PALETTE;
    if (!PALETTES[template.id]) {
      skipped.push(`${template.id} (no palette, used fallback colors)`);
    }

    writeFileSync(target, renderPreview(palette));
    written += 1;
    console.log(`  ${template.previewImage}  <-  ${template.name}`);
  }

  console.log(`\nWrote ${written} preview image(s) to public/templates/`);
  if (skipped.length) {
    console.warn("\nNotes:");
    skipped.forEach((note) => console.warn(`  - ${note}`));
  }
};

generate();
