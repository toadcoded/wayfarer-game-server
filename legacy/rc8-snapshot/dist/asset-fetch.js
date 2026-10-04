/** Bounded same-origin asset fetches; cache owns successful bytes, callers receive copies. */
export class AssetFetcher {
    fetcher;
    timeoutMs;
    cache = new Map();
    pending = new Map();
    active = 0;
    waiting = [];
    constructor(fetcher = fetch.bind(globalThis), timeoutMs = 4000) {
        this.fetcher = fetcher;
        this.timeoutMs = timeoutMs;
        if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000)
            throw new Error('Invalid fetch timeout');
    }
    async load(path) {
        if (!/^\/preview\/assets\/[a-z][a-z0-9-]*\.(png|json)$/.test(path))
            throw new Error('Asset path rejected');
        const saved = this.cache.get(path);
        if (saved)
            return saved.slice();
        let promise = this.pending.get(path);
        if (!promise) {
            if (this.pending.size >= 16)
                throw new Error('Asset queue full');
            promise = this.run(path);
            this.pending.set(path, promise);
        }
        try {
            return (await promise).slice();
        }
        finally {
            if (this.pending.get(path) === promise)
                this.pending.delete(path);
        }
    }
    async run(path) {
        if (this.active >= 2)
            await new Promise(resolve => this.waiting.push(resolve));
        else
            this.active++;
        try {
            for (let attempt = 0; attempt < 2; attempt++) {
                const controller = new AbortController(), timer = setTimeout(() => controller.abort(), this.timeoutMs);
                try {
                    const response = await this.fetcher(path, { signal: controller.signal, credentials: 'same-origin', redirect: 'error' });
                    if (!response.ok) {
                        await response.body?.cancel();
                        if (response.status >= 500 && attempt === 0)
                            continue;
                        throw new Error(`Asset HTTP ${response.status}`);
                    }
                    const expected = path.endsWith('.png') ? 'image/png' : 'application/json';
                    if (response.headers.get('content-type')?.split(';')[0] !== expected) {
                        await response.body?.cancel();
                        throw new Error('Asset MIME mismatch');
                    }
                    const limit = path.endsWith('.png') ? 2_000_000 : 32_768, parts = [];
                    let size = 0;
                    const reader = response.body?.getReader();
                    if (!reader)
                        throw new Error('Empty asset stream');
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done)
                                break;
                            size += value.length;
                            if (size > limit)
                                throw new Error('Asset exceeds limit');
                            parts.push(value);
                        }
                    }
                    catch (e) {
                        await reader.cancel();
                        throw e;
                    }
                    finally {
                        reader.releaseLock();
                    }
                    const bytes = new Uint8Array(size);
                    let offset = 0;
                    for (const part of parts) {
                        bytes.set(part, offset);
                        offset += part.length;
                    }
                    if (this.cache.size >= 16)
                        this.cache.delete(this.cache.keys().next().value);
                    this.cache.set(path, bytes);
                    return bytes;
                }
                finally {
                    clearTimeout(timer);
                }
            }
            throw new Error('Asset retry exhausted');
        }
        finally {
            const next = this.waiting.shift();
            if (next)
                next();
            else
                this.active--;
        }
    }
}
export const assetFetcher = typeof fetch === 'function' ? new AssetFetcher() : undefined;
export async function loadSpriteSheet(id, width, height) {
    if (!assetFetcher)
        throw new Error('Fetch unavailable');
    const bytes = await assetFetcher.load(`/preview/assets/${id}.png`);
    if (bytes.length < 24 || bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71)
        throw new Error('Invalid PNG');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(16) !== width || view.getUint32(20) !== height)
        throw new Error('Sprite dimensions mismatch');
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0);
        return canvas;
    }
    finally {
        bitmap.close();
    }
}
