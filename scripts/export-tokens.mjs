/**
 * Regenerates `design-tokens.json` from `src/design-system/tokens.ts`.
 *
 *   npm run tokens:export
 *
 * The JSON is a flat, tool-friendly mirror of the typed tokens so the values
 * can be mapped onto Figma Variables (or any other design-token consumer)
 * without hand-copying hex codes out of the CSS.
 */

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require_ = createRequire(import.meta.url);

// tokens.ts is plain data with type annotations — strip the TS-only syntax we
// use (type/interface declarations, `as const`, type annotations) by running it
// through esbuild, which ships with Vite.
const esbuild = require_('esbuild');

const built = esbuild.buildSync({
  entryPoints: [resolve(root, 'src/design-system/tokens.ts')],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
});

const module_ = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);

const out = resolve(root, 'design-tokens.json');
writeFileSync(out, `${JSON.stringify(module_.designTokens, null, 2)}\n`, 'utf8');

console.log(`Wrote ${out}`);
