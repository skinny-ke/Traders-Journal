// Generates Trade Journal PWA icons as valid PNG files using Node built-ins.
// Creates:
//   public/pwa-192x192.png          (192×192, purpose: any)
//   public/pwa-512x512.png          (512×512, purpose: any)
//   public/pwa-maskable-192x192.png (192×192, purpose: maskable)
//   public/pwa-maskable-512x512.png (512×512, purpose: maskable)
//
// PNG IDAT data is compressed with Node's built-in zlib.deflateSync, which
// produces RFC 1950 (zlib) output — the format the PNG spec requires.
// The previous implementation wrote raw RFC 1951 deflate blocks without
// the required 2-byte CMF/FLG header and 4-byte Adler-32 trailer, causing
// all major browsers to reject the files as invalid images.

"use strict";

const fs   = require("fs");
const path = require("path");
const zlib = require("zlib");

const PROJECT_ROOT = path.join(__dirname, "..");
const PUBLIC_DIR   = path.join(PROJECT_ROOT, "public");

// ── PNG helpers ────────────────────────────────────────────────────────────

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const lenBuf  = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf  = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Build a valid PNG from an RGBA pixel buffer.
 * Uses Node's zlib.deflateSync for RFC-1950-compliant IDAT compression.
 */
function createPng(width, height, draw) {
  // Fill RGBA pixel buffer
  const raw = Buffer.alloc(width * height * 4, 0);
  draw(raw, width, height);

  // Prepend a filter-type byte (0 = None) to every scanline
  const filtered = Buffer.allocUnsafe(height + width * height * 4);
  let fi = 0;
  for (let y = 0; y < height; y++) {
    filtered[fi++] = 0; // filter type: None
    raw.copy(filtered, fi, y * width * 4, (y + 1) * width * 4);
    fi += width * 4;
  }

  // Compress with zlib (RFC 1950) — required by the PNG spec.
  // Best compression keeps file sizes reasonable.
  const compressed = zlib.deflateSync(filtered, { level: zlib.constants.Z_BEST_COMPRESSION });

  // Build IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]  = 8; // bit depth: 8 bits per channel
  ihdr[9]  = 6; // colour type: RGBA
  ihdr[10] = 0; // compression method: deflate
  ihdr[11] = 0; // filter method: adaptive
  ihdr[12] = 0; // interlace: none

  return Buffer.concat([
    // PNG signature
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    writeChunk("IHDR", ihdr),
    writeChunk("IDAT", compressed),
    writeChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Brand colours (matching Tailwind config) ───────────────────────────────

function hex(h) {
  h = h.replace("#", "");
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}

const BRAND_DARK   = hex("#0f172a"); // slate-900
const BRAND_PANEL  = hex("#1e293b"); // slate-800
const BRAND_ACCENT = hex("#38bdf8"); // sky-400

// ── Icon drawing ───────────────────────────────────────────────────────────

/**
 * Draw the Trade Journal icon into an RGBA buffer.
 *
 * Non-maskable layout (purpose: any):
 *   • Full background: BRAND_DARK (transparent corners for circular feel)
 *   • Outer ring inside circle: BRAND_PANEL
 *   • Inner fill: BRAND_ACCENT
 *   • "TJ" letterforms in BRAND_DARK
 *
 * Maskable layout (purpose: maskable):
 *   • Solid BRAND_DARK background across the entire canvas (no transparency
 *     outside the safe zone — required by the maskable spec).
 *   • BRAND_ACCENT circle inscribed in the maskable safe zone.
 */
function drawIcon(raw, width, height, maskable) {
  const cx = width  / 2;
  const cy = height / 2;
  const outerR  = Math.min(width, height) * 0.42;
  // Maskable safe zone: inscribed circle shrunk by 10 % on each side
  const safeR   = Math.min(width, height) * (maskable ? 0.40 : 0.42);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx  = (y * width + x) * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      let r, g, b, a;

      if (maskable) {
        // Maskable icons must have no transparency (the OS clips them).
        // Background: solid BRAND_DARK; accent circle in safe zone.
        if (dist <= safeR * 0.90) {
          ({ r, g, b } = BRAND_ACCENT);
        } else if (dist <= safeR) {
          ({ r, g, b } = BRAND_PANEL);
        } else {
          ({ r, g, b } = BRAND_DARK);
        }
        a = 255;
      } else {
        // Non-maskable: transparent outside the outer circle, rings inside.
        if (dist > outerR) {
          r = g = b = a = 0; // transparent corner
        } else if (dist > outerR * 0.78) {
          ({ r, g, b } = BRAND_PANEL);
          a = 255;
        } else {
          ({ r, g, b } = BRAND_ACCENT);
          a = 255;
        }
      }

      raw[idx]     = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = a;

      // Render "TJ" letterforms inside the accent area of non-maskable icons.
      if (!maskable && dist < outerR * 0.55) {
        const tx = x - cx;
        const ty = y - cy;
        const sr = outerR; // shorthand

        // Letter T: horizontal top-bar + vertical stem
        const letterT =
          (Math.abs(ty + sr * 0.14) < 3 && Math.abs(tx) < sr * 0.22) ||
          (Math.abs(tx) < 4 && ty > -sr * 0.14 && ty < sr * 0.42);

        // Letter J: vertical bar + bottom hook
        const letterJ =
          (Math.abs(tx - sr * 0.17) < 4 && ty > -sr * 0.14 && ty < sr * 0.35) ||
          (Math.abs(ty - sr * 0.35) < 3 && Math.abs(tx - sr * 0.17) < sr * 0.13) ||
          (Math.abs(tx - (sr * 0.17 + sr * 0.13)) < 4 && ty > -sr * 0.14 && ty < sr * 0.35);

        if (letterT || letterJ) {
          raw[idx]     = BRAND_DARK.r;
          raw[idx + 1] = BRAND_DARK.g;
          raw[idx + 2] = BRAND_DARK.b;
          raw[idx + 3] = 255;
        }
      }
    }
  }
}

// ── Write icons ────────────────────────────────────────────────────────────

function writePng(name, width, height, maskable) {
  const png = createPng(width, height, (raw) => drawIcon(raw, width, height, maskable));
  const out = path.join(PUBLIC_DIR, name);
  fs.writeFileSync(out, png);

  // Quick self-test: verify the generated file passes Node's own zlib decoder.
  const written = fs.readFileSync(out);
  const idatIdx = written.indexOf(Buffer.from("IDAT", "ascii"));
  const idatLen = written.readUInt32BE(idatIdx - 4);
  const idatData = written.slice(idatIdx + 4, idatIdx + 4 + idatLen);
  try {
    zlib.inflateSync(idatData); // throws if zlib header is missing/corrupt
    console.log(`✓  ${name}  (${width}×${height}, ${png.length} bytes, zlib OK)`);
  } catch (e) {
    console.error(`✗  ${name}  FAILED zlib self-test: ${e.message}`);
    process.exitCode = 1;
  }
}

writePng("pwa-192x192.png",          192, 192, false);
writePng("pwa-512x512.png",          512, 512, false);
writePng("pwa-maskable-192x192.png", 192, 192, true);
writePng("pwa-maskable-512x512.png", 512, 512, true);

console.log("\nAll PWA icons generated.");
