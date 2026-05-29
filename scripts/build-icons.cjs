/* eslint-disable no-console */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, 'icon-master.svg');
const OUT_DIR = path.resolve(__dirname, '..', 'frontend', 'public', 'icons');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { name: 'icon-180.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512, padding: 0.1 },
];

(async () => {
  const svg = fs.readFileSync(SRC);
  for (const t of targets) {
    let pipe = sharp(svg, { density: 600 }).resize(t.size, t.size, { fit: 'cover' });
    if (t.padding) {
      const inner = Math.round(t.size * (1 - t.padding * 2));
      pipe = sharp(svg, { density: 600 })
        .resize(inner, inner)
        .extend({
          top: Math.round((t.size - inner) / 2),
          bottom: Math.round((t.size - inner) / 2),
          left: Math.round((t.size - inner) / 2),
          right: Math.round((t.size - inner) / 2),
          background: { r: 251, g: 247, b: 240, alpha: 1 },
        });
    }
    const buf = await pipe.png({ compressionLevel: 9 }).toBuffer();
    const outPath = path.join(OUT_DIR, t.name);
    fs.writeFileSync(outPath, buf);
    console.log(`wrote ${outPath} (${buf.length} bytes)`);
  }
})();
