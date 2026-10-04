import {readFileSync,writeFileSync} from 'node:fs';
import {parseAssetCatalog} from '../dist/asset-catalog.js';
const assets=parseAssetCatalog(JSON.parse(readFileSync(new URL('../preview/assets/manifest.json',import.meta.url),'utf8')));
writeFileSync(new URL('../src/character-assets.ts',import.meta.url),'export const CHARACTER_ASSETS = '+JSON.stringify(assets.filter(a=>a.role==='selectable cosmetic'))+' as const;\n');
console.log('Validated and regenerated character catalog; run npm run build next.');
