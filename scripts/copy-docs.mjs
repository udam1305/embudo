import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'embudo', 'build');
const targetDir = path.join(rootDir, 'dist', 'docs');

if (!fs.existsSync(sourceDir)) {
  console.warn('[copy-docs] embudo/build no existe todavía; se omite la copia de /docs.');
  process.exit(0);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });
console.log('[copy-docs] Docusaurus copiado correctamente a dist/docs');
