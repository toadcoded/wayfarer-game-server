# Gathering and the Warden forge

This is the first repeatable gathering-to-PvM upgrade loop, integrated into the current multiplayer causeway. Open Gathering & artisan tools in the realm controls.

1. Travel to within 8 metres of the far landing. Gather logs (Woodcutting), ore (Mining) or fish (Fishing). Stay outside the Warden's 4-metre pulse ring while gathering safely. All three are early prototype activities in one gathering zone; distinct regional nodes/animations are not complete.
2. Each accepted gather gives 25 XP to exactly that profession. Tools yield 1/2/3 resources. A shared per-player 40-tick (2-second) cooldown prevents instant switching/spam; the resource pack holds 12 total units. Quest reeds and weapon inventory remain separate.
3. Return within 3 metres of Halden and Bank pack. All carried resources move atomically into your private bank. The bank also receives Warden essence automatically, one per contributing clear; noncontributors get none. Contributors retain existing encounter eligibility/recovery rules. Essence is guaranteed, not a rare drop.
4. Craft next tool tier from the bank. Requirements and deductions are server-owned; the client sends only a command, no resource quantity, XP or roll.

| Tool tier | Requirements | Bank cost | Yield |
| --- | --- | --- | --- |
| Starter | New character | Free | 1 |
| Artisan | Level 2 in all three professions | 3 logs + 3 ore + 3 fish + 1 Warden essence | 2 |
| Masterwork | Artisan owned; level 5 in all three | 20 logs + 20 ore + 20 fish + 5 Warden essence | 3 |

Level 2 requires 100 XP / four gathers per profession. Level 5 requires 1,600 XP / 64 gathers per profession. Crafting spends resources without creating XP and cannot skip a tier or charge again after maximum tier. This links combat clears to useful gathering upgrades and gives a longer second target.

## Integrity and persistence

Resource bank entries cap at 1,000,000 each. Deposits reject the entire transfer if any limit would overflow. XP uses the existing provisional level curve, 100(L-1)^2, capped at level 99; only the two listed unlocks exist. Additional levels are not presented as additional completed content.

Each player's XP, pack, bank, tool tier and relative gathering cooldown persist in local gameplay-save schema 3. Strict versions 1/2 migrate to empty profession state while retaining combat builds/items/quests. Existing outer player-save and signed-local-profile identity are unchanged. Simulation contract 10 rejects older clients/replay contracts. Banks and XP are not included in other players' public appearance list.

Gathering/crafting is blocked while knocked out. Positions, clocks, contribution rewards and deductions are resolved in the same detached authoritative gameplay transaction; a fault exposes no partial grant.

The resource pack is not an equippable cape-slot skilling sack. Capes/quivers/rare sacks, resource economies/trading, tiered regional content, crafting skill XP, gathering animation clips, fish cooking/consumption, multiple bosses and rare drops remain future work. No production authentication/cloud durability or GPU visual pass is implied.
