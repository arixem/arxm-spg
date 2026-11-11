// Genera images/manifest.json con todas las imágenes de la carpeta images/.
// Se ejecuta en el build de Cloudflare Pages (y en local antes de probar).
// Uso: node scripts/build-images.mjs
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'images';
const EXT = /\.(jpe?g|png|webp|avif)$/i;

if (!existsSync(DIR)) mkdirSync(DIR);

const files = readdirSync(DIR, { withFileTypes: true })
  .filter(f => f.isFile() && EXT.test(f.name) && !f.name.startsWith('.'))
  .map(f => f.name)
  .sort((a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }));

const manifest = files.map(name => ({ src: `${DIR}/${encodeURIComponent(name)}` }));
writeFileSync(join(DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest.json: ${manifest.length} imagen(es)`);
