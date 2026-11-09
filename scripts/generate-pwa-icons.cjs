// Generates Trade Journal PWA icons as PNG files using only Node built-ins.
// Creates: public/pwa-192x192.png, public/pwa-512x512.png, public/pwa-maskable-512x512.png

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

function zlibCrc32(buf) {
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
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlibCrc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function adler32(buf) {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % MOD;
    b = (b + a) % MOD;
  }
  return (b << 16) | a;
}

function deflateRawSync(input) {
  // Minimal stored (uncompressed) deflate block: valid but not compressed.
  // PNG allows stored deflate blocks. We split into 65535-byte chunks.
  const chunks = [];
  let pos = 0;
  while (pos < input.length) {
    const block = input.slice(pos, pos + 65535);
    const final = pos + block.length >= input.length ? 1 : 0;
    const hdr = Buffer.alloc(1);
    hdr[0] = (final << 0) | (0 << 1) | (0 << 2) | (0 << 3); // BFINAL, BTYPE=00 (stored)
    const len = Buffer.alloc(2);
    len.writeUInt16LE(block.length, 0);
    const nlen = Buffer.alloc(2);
    nlen.writeUInt16LE((~block.length) & 0xffff, 0);
    chunks.push(hdr, len, nlen, block);
    pos += block.length;
  }
  return Buffer.concat(chunks);
}

function createPng(width, height, draw) {
  // RGBA raw image
  const raw = Buffer.alloc(width * height * 4, 0);
  draw(raw, width, height);

  // Filter bytes (none) prefix each scanline
  const filtered = Buffer.alloc(width * height * 4 + height);
  let fi = 0;
  for (let y = 0; y < height; y++) {
    filtered[fi++] = 0; // filter type none
    raw.copy(filtered, fi, y * width * 4, (y + 1) * width * 4);
    fi += width * 4;
  }

  const compressed = deflateRawSync(filtered);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    writeChunk("IHDR", ihdr),
    writeChunk("IDAT", compressed),
    writeChunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// Brand colors matching tailwind config
const BRAND_DARK = hexToRgb("#0f172a");   // slate-900
const BRAND_PANEL = hexToRgb("#1e293b");  // slate-800
const BRAND_ACCENT = hexToRgb("#38bdf8"); // cyan-400
const WHITE = { r: 255, g: 255, b: 255 };

function drawIcon(raw, width, height, maskable) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.42;
  const pad = maskable ? Math.min(width, height) * 0.11 : 0; // safe zone for maskable

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let bg = null;

      if (maskable) {
        // Maskable: transparent safe zone outside the inner circle
        if (dist > radius - pad) {
          bg = { r: 0, g: 0, b: 0, a: 0 };
        } else {
          bg = { ...BRAND_DARK, a: 255 };
        }
      } else {
        if (dist > radius) {
          // Outside circle: brand dark
          bg = { ...BRAND_DARK, a: 255 };
        } else if (dist > radius * 0.78) {
          // Outer ring: brand panel
          bg = { ...BRAND_PANEL, a: 255 };
        } else {
          bg = { ...BRAND_ACCENT, a: 255 };
        }
      }

      raw[i] = bg.r;
      raw[i + 1] = bg.g;
      raw[i + 2] = bg.b;
      raw[i + 3] = bg.a;

      // Draw "TJ" letters in the center (only for non-maskable to keep maskable clean, but draw anyway within safe zone)
      if (!maskable && dist < radius * 0.55) {
        const tx = x - cx;
        const ty = y - cy;
        // Letter T: top bar + vertical stem
        const letterT =
          (Math.abs(ty + radius * 0.14) < 3 && Math.abs(tx) < radius * 0.22) ||
          (Math.abs(tx) < 4 && ty > -radius * 0.14 && ty < radius * 0.42);
        // Letter J: hook shape
        const letterJ =
          (Math.abs(tx - radius * 0.17) < 4 && ty > -radius * 0.14 && ty < radius * 0.35) ||
          (Math.abs(ty - radius * 0.35) < 3 && Math.abs(tx - radius * 0.17) < radius * 0.13) ||
          (Math.abs(tx - (radius * 0.17 + radius * 0.13)) < 4 && ty > -radius * 0.14 && ty < radius * 0.35);
        if (letterT || letterJ) {
          raw[i] = BRAND_DARK.r;
          raw[i + 1] = BRAND_DARK.g;
          raw[i + 2] = BRAND_DARK.b;
          raw[i + 3] = 255;
        }
      }
    }
  }
}

function writePng(name, width, height, maskable) {
  const png = createPng(width, height, (raw) => drawIcon(raw, width, height, maskable));
  const out = path.join(PUBLIC_DIR, name);
  fs.writeFileSync(out, png);
  console.log(`Wrote ${out} (${png.length} bytes)`);
}

writePng("pwa-192x192.png", 192, 192, false);
writePng("pwa-512x512.png", 512, 512, false);
writePng("pwa-maskable-512x512.png", 512, 512, true);

console.log("PWA icons generated.");
