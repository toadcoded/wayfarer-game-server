# Basic practice training

All methods are available at level 1 in the same 3-metre camp interaction zone beside Halden (world centre x=38, z=0). Fixture positions are checked against the live navigation surface; all six are within the zone, on the landing, away from the bridge lane. Props are nonpickable cosmetic representations. The button is a placeholder drill action, not a full per-tool animation or production activity loop.

| Skill | Fixture | Basic drill |
| --- | --- | --- |
| Attack | dummy | Aim controlled strikes at the straw dummy |
| Strength | dummy | Push the weighted training post |
| Defence | dummy | Rehearse a shield block against the padded post |
| Ranged | dummy | Aim tethered practice arrows at the straw target |
| Magic | altar | Trace a harmless light rune |
| Hitpoints | course | Perform a gentle conditioning drill |
| Prayer | altar | Reflect quietly at the practice shrine |
| Woodcutting | bench | Rehearse axe strokes on a reusable practice log |
| Mining | bench | Tap the reusable training stone |
| Fishing | pond | Rehearse casting with a hookless practice rod |
| Agility | course | Rehearse a balance-step drill |
| Cooking | bench | Rehearse stirring an empty training pot |
| Crafting | bench | Shape reusable practice clay |
| Firemaking | bench | Rehearse tinder preparation without lighting a fire |
| Fletching | bench | Fit reusable blunt arrow parts |
| Herblore | bench | Sort labelled inert herb samples |
| Runecrafting | altar | Trace a practice rune on an inert tablet |
| Slayer | dummy | Study a reusable creature-tracking card |
| Smithing | bench | Tap a cold practice billet with a wooden mallet |
| Thieving | bench | Rehearse opening an unlocked practice box |
| Farming | garden | Tend the demonstration planter |
| Construction | bench | Fit reusable wooden joints |
| Hunter | garden | Rehearse a harmless empty trap frame |

One selected skill gets 1 XP, never a secondary skill. Attack/Defence practice is optional, allowing pure Strength players to avoid accidental cross-training. Every practice method shares a five-second cooldown; changing weapon, skin, combat training mode or skill does not reset it. There is no offline award or catch-up. Level bonuses stop at 99, XP continues to the existing 200-million storage cap. A capped skill rejects the practice award without overflow.

The server accepts only `{kind:"action", sequence:0, action:"practice", value:"agility"}` with a known skill and valid increasing sequence. It reads server-owned position and health at commit time. The client cannot select the player, XP amount, position or cooldown. Failed distance checks give no XP and consume no recovery. The server enforces recovery even if the client enables its button or submits eight actions in one tick. Practice clocks are private to their profile and omitted from public appearance records.

The saved `practiceReadyTick` field represents *remaining cooldown ticks* in schema 5; the live snapshot field is an absolute server tick. Valid older saves initialize it to zero. Reconnecting or restarting rebases the remaining ticks against the new server clock. The local profile mechanism limits one active realm socket per profile; it does not establish production account identity, bot resistance or durable shared-world economy.

No duplicate resource rewards, drops, stock depletion, enemy damage or item transfer are created. Full skilling recipes and gathering-trip balance remain future content; this yard is deliberately low-value and useful for testing each progression field.
