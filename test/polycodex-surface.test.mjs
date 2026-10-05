import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('v1.2 surface contains the seven-panel HUD, minimap, local chat and authority-backed PolyCodex controls',async()=>{
 const page=await readFile(new URL('../preview/realm.html',import.meta.url),'utf8');
 assert.equal((page.match(/data-hud-tab=/g)||[]).length,7);
 assert.equal((page.match(/data-hud-panel=/g)||[]).length,7);
 for(const id of ['tab-codex','panel-codex','codex-wheel','codex-cast','realm-minimap','realm-chat','realm-chat-log'])assert.equal((page.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
 assert.match(page,/game mechanic, not a scientific or medical claim/i);
 assert.match(page,/server validates range, cooldown, effect duration/i);
 assert.match(page,/Celestial Observatory/i);
 assert.match(page,/Moonlight Cavern/i);
 assert.match(page,/astral snail/i);
 const css=await readFile(new URL('../preview/realm-retro.css',import.meta.url),'utf8');
 for(const selector of ['#codex-wheel','#realm-minimap','#realm-chat','.codex-node','.realm-layer-note'])assert.ok(css.includes(selector),selector);
 assert.match(css,/prefers-reduced-motion/);
});

test('public chat copy does not impersonate network users and PolyCodex casts route to the server',async()=>{
 const source=await readFile(new URL('../src/realm-interface.ts',import.meta.url),'utf8');
 assert.match(source,/Public chat transport is not enabled/);
 assert.match(source,/authoritative realm/i);
 assert.match(source,/onCast\?\.\(encodeResonanceCast\(selected\)\)/);
 assert.doesNotMatch(source,/cosmetic\/local/);
});
