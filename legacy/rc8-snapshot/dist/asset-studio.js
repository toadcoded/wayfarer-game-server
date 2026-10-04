import { assetFetcher, loadSpriteSheet } from './asset-fetch.js';
import { parseAssetCatalog } from './asset-catalog.js';
import { keyMagenta, animationFrame } from './character-motion.js';
const reduced = matchMedia('(prefers-reduced-motion: reduce)'), root = document.querySelector('#assets'), status = document.querySelector('#status');
const loaded = [];
let animation = 0;
async function start() {
    if (!assetFetcher)
        throw new Error('Fetch unavailable');
    const assets = parseAssetCatalog(JSON.parse(new TextDecoder().decode(await assetFetcher.load('/preview/assets/manifest.json'))));
    for (const asset of assets) {
        const card = document.createElement('article'), title = document.createElement('h2'), caption = document.createElement('p'), canvas = document.createElement('canvas');
        title.textContent = asset.id;
        caption.textContent = asset.role;
        canvas.width = asset.width;
        canvas.height = asset.height;
        canvas.setAttribute('aria-label', asset.id + ' animation');
        card.append(title, canvas, caption);
        root.append(card);
        const sheet = await loadSpriteSheet(asset.id, asset.width * asset.frames, asset.height);
        const ctx = sheet.getContext('2d');
        const pixels = ctx.getImageData(0, 0, sheet.width, sheet.height);
        keyMagenta(pixels.data);
        ctx.putImageData(pixels, 0, 0);
        loaded.push({ asset, sheet, ctx: canvas.getContext('2d') });
    }
    status.textContent = 'All seven assets loaded. Reduced-motion preferences are respected.';
    function frame(now) { if (!document.hidden)
        for (const { asset, sheet, ctx } of loaded) {
            const n = reduced.matches ? 0 : animationFrame(asset.durationsMs, now);
            ctx.clearRect(0, 0, asset.width, asset.height);
            ctx.drawImage(sheet, n * asset.width, 0, asset.width, asset.height, 0, 0, asset.width, asset.height);
        } animation = requestAnimationFrame(frame); }
    animation = requestAnimationFrame(frame);
}
addEventListener('pagehide', () => cancelAnimationFrame(animation));
start().catch(() => { status.textContent = 'Some assets could not load. The walking previews retain a vector character fallback.'; });
