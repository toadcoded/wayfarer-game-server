import { PGliteWorker } from '@electric-sql/pglite/worker';
import { PGliteVisualSurface } from './visual-surface.js';
export async function createVisualSurface() {
    if (typeof Worker === 'undefined' || typeof indexedDB === 'undefined')
        throw new Error('Local database unavailable in this browser');
    const thread = new Worker('/preview/pglite-worker.bundle.js', { type: 'module' });
    const db = new PGliteWorker(thread, { id: 'wayfarer-visual-preferences-v1', dataDir: 'idb://wayfarer-visual-preferences-v1' });
    let timer;
    try {
        await Promise.race([db.waitReady, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Local database initialization timed out')), 20000); })]);
        const surface = new PGliteVisualSurface(db);
        await surface.getQuality();
        return surface;
    }
    catch (error) {
        thread.terminate();
        throw error;
    }
    finally {
        clearTimeout(timer);
    }
}
