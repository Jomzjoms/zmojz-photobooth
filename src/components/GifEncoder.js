/**
 * Animated GIF encoder — pure JS, no workers, no CDN.
 * Uses median-cut color quantization for accurate color reproduction,
 * fixing washed-out / blocky artifacts on bright or high-contrast images.
 */
export class GifEncoder {
  constructor(width, height, { repeat = 0, delay = 8 } = {}) {
    this.width  = width;
    this.height = height;
    this.repeat = repeat; // 0 = loop forever, -1 = no loop
    this.delay  = delay;  // centiseconds per frame
    this.frames = [];
  }

  addFrame(imageData) {
    this.frames.push(new Uint8ClampedArray(imageData));
  }

  finish() {
    const { width, height, frames, repeat, delay } = this;
    const parts = [];

    // Header
    parts.push(str2bytes('GIF89a'));
    parts.push(word(width), word(height));
    parts.push([0x00, 0x00, 0x00]); // no global color table, bg=0, aspect=0

    // Netscape loop extension
    if (repeat >= 0) {
      parts.push([0x21, 0xFF, 0x0B]);
      parts.push(str2bytes('NETSCAPE2.0'));
      parts.push([0x03, 0x01]);
      parts.push(word(repeat));
      parts.push([0x00]);
    }

    for (const frameData of frames) {
      const { palette, indices } = medianCutQuantize(frameData, width * height, 256);
      const palSize = palette.length;

      let colorBits = 1;
      while ((1 << colorBits) < palSize) colorBits++;
      const tableLen = 1 << colorBits;

      // Graphic Control Extension
      parts.push([0x21, 0xF9, 0x04, 0x00]);
      parts.push(word(delay));
      parts.push([0x00, 0x00]);

      // Image Descriptor
      parts.push([0x2C]);
      parts.push(word(0), word(0), word(width), word(height));
      parts.push([0x80 | (colorBits - 1)]); // local color table

      // Local Color Table
      const ct = [];
      for (let i = 0; i < tableLen; i++) {
        if (i < palSize) ct.push(palette[i][0], palette[i][1], palette[i][2]);
        else             ct.push(0, 0, 0);
      }
      parts.push(ct);

      // LZW compressed data
      const lzwMin     = Math.max(2, colorBits);
      const compressed = lzwEncode(indices, lzwMin);
      parts.push([lzwMin]);
      for (let i = 0; i < compressed.length; i += 255) {
        const chunk = compressed.slice(i, i + 255);
        parts.push([chunk.length, ...chunk]);
      }
      parts.push([0x00]);
    }

    parts.push([0x3B]); // GIF trailer

    const total = parts.reduce((n, p) => n + p.length, 0);
    const out   = new Uint8Array(total);
    let   off   = 0;
    for (const p of parts) { out.set(p, off); off += p.length; }
    return new Blob([out], { type: 'image/gif' });
  }
}

// ── Median-Cut Color Quantization ─────────────────────────────────────────────
// Properly represents highlights, shadows, and saturated colors within 256 colors.

function medianCutQuantize(rgba, numPixels, maxColors) {
  // Sample pixels for speed on large frames
  const step = numPixels > 60000 ? 2 : 1;
  const colorList = [];
  for (let i = 0; i < numPixels; i += step) {
    colorList.push([rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]]);
  }

  // Build palette via median-cut
  const palette = medianCut(colorList, maxColors);

  // Map each pixel to nearest palette entry
  const indices = new Uint8Array(numPixels);
  for (let i = 0; i < numPixels; i++) {
    indices[i] = nearestColor(palette, rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
  }

  return { palette, indices };
}

function medianCut(colors, maxColors) {
  let buckets = [colors];

  while (buckets.length < maxColors) {
    // Split the bucket with the largest color range
    let splitIdx = 0;
    let maxRange = -1;
    for (let b = 0; b < buckets.length; b++) {
      const range = colorRange(buckets[b]);
      if (range > maxRange) { maxRange = range; splitIdx = b; }
    }

    const bucket = buckets[splitIdx];
    if (bucket.length <= 1) break;

    // Sort by the channel with the widest spread, split at median
    const ch = widestChannel(bucket);
    bucket.sort((a, b) => a[ch] - b[ch]);
    const mid = Math.floor(bucket.length / 2);
    buckets.splice(splitIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
  }

  // Representative color = average of bucket
  return buckets.map(bucket => {
    let r = 0, g = 0, b = 0;
    for (const c of bucket) { r += c[0]; g += c[1]; b += c[2]; }
    const n = bucket.length;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
}

function colorRange(bucket) {
  if (!bucket.length) return 0;
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const [r, g, b] of bucket) {
    if (r < rMin) rMin = r; if (r > rMax) rMax = r;
    if (g < gMin) gMin = g; if (g > gMax) gMax = g;
    if (b < bMin) bMin = b; if (b > bMax) bMax = b;
  }
  return Math.max(rMax - rMin, gMax - gMin, bMax - bMin);
}

function widestChannel(bucket) {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const [r, g, b] of bucket) {
    if (r < rMin) rMin = r; if (r > rMax) rMax = r;
    if (g < gMin) gMin = g; if (g > gMax) gMax = g;
    if (b < bMin) bMin = b; if (b > bMax) bMax = b;
  }
  const ranges = [rMax - rMin, gMax - gMin, bMax - bMin];
  return ranges.indexOf(Math.max(...ranges));
}

function nearestColor(palette, r, g, b) {
  let best = Infinity, idx = 0;
  for (let i = 0; i < palette.length; i++) {
    const dr = r - palette[i][0];
    const dg = g - palette[i][1];
    const db = b - palette[i][2];
    // Weight green more heavily — human vision is most sensitive to it
    const d = dr * dr + 2 * dg * dg + db * db;
    if (d < best) { best = d; idx = i; }
  }
  return idx;
}

// ── LZW Encoder ───────────────────────────────────────────────────────────────

function lzwEncode(indices, minCodeSize) {
  const clearCode = 1 << minCodeSize;
  const eofCode   = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = eofCode + 1;
  const maxCode = () => 1 << codeSize;

  const output  = [];
  let   buf     = 0;
  let   bufBits = 0;

  const writeBits = (code) => {
    buf |= code << bufBits;
    bufBits += codeSize;
    while (bufBits >= 8) {
      output.push(buf & 0xFF);
      buf >>= 8;
      bufBits -= 8;
    }
  };

  const flush = () => { if (bufBits > 0) output.push(buf & 0xFF); };

  let table = new Map();
  const resetTable = () => {
    table.clear();
    for (let i = 0; i < clearCode; i++) table.set('' + i, i);
    codeSize = minCodeSize + 1;
    nextCode = eofCode + 1;
  };

  resetTable();
  writeBits(clearCode);

  let str = '' + indices[0];
  for (let i = 1; i < indices.length; i++) {
    const strC = str + ',' + indices[i];
    if (table.has(strC)) {
      str = strC;
    } else {
      writeBits(table.get(str));
      if (nextCode < 4096) {
        table.set(strC, nextCode++);
        if (nextCode > maxCode() && codeSize < 12) codeSize++;
      } else {
        writeBits(clearCode);
        resetTable();
      }
      str = '' + indices[i];
    }
  }
  writeBits(table.get(str));
  writeBits(eofCode);
  flush();
  return output;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function str2bytes(s) { return Array.from(s).map(c => c.charCodeAt(0)); }
function word(n)      { return [n & 0xFF, (n >> 8) & 0xFF]; }