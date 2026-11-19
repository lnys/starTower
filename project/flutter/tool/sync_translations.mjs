// Run from any directory: node flutter/tool/sync_translations.mjs
import { copyFileSync } from 'node:fs';

copyFileSync(new URL('../../design/translations.json', import.meta.url),
  new URL('../assets/data/translations.json', import.meta.url));
