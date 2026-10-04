# rc.9 — independent combat training

This internal v0.8 candidate builds on Seraphine and the Lantern Trials. It is not public v0.9 or v0.8.1.

## Play

The realm's Train selector chooses Attack, Strength, Defence or Magic exclusively. Melee/unarmed attacks support the first three; the ash staff requires Magic training. Equipping a weapon never silently changes the selected training mode: choose a compatible mode before attacking. Default training is Strength. Successful Warden hits award four XP per point of actual health removed, solely to the selected skill. Overkill, rejected attacks, guards, cooldowns and out-of-range actions award no XP. Packet order within a tick determines which explicit mode applies to a hit.

XP and training mode are private server-owned state and retained in local profiles. Clients can request a mode, never a level or XP grant. Gameplay-save schema 2 migrates strict schema-1 profiles to zero XP while retaining appearance, quest, inventory and equipment. The outer player-save envelope stays version 1. Old software cannot read new gameplay schema 2; preserve a backup of profile databases before upgrading. Protocol simulation revision 9 rejects earlier clients.

## Provisional progression, not final balance

Five independent XP tracks exist: Attack, Strength, Defence, Ranged and Magic. Ranged has no training mode until an actual bow/ammunition loop exists. Level 1 begins at 0 XP, level L at `100 × (L−1)²`, capped at level 99 / 960,400 XP. Current Warden damage and cooldowns are unchanged; levels do not yet scale accuracy, damage or speed. The target remains guaranteed-hit training, not a complete competitive combat model.

The displayed combat bracket is an original provisional formula, not a RuneScape clone:

`max(3, floor((100 × (Defence + 10) + 130 × max(Attack + Strength, floor(1.5 × Ranged), floor(1.5 × Magic))) / 400))`

It is informational only; PvP and matchmaking are not implemented. No hidden shared/Defence XP is awarded, and training modes deliberately have no damage bonuses that would tempt accidental XP contamination.

The catalog provides 15 level bands: 1, 7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 91, 99. These are a structure for future items, not 15 completed weapon sets. Requirements, tier, accuracy rating and attack cadence are independent fields. Existing starter requirements are deliberately permissive: reed blade Attack 1; granite maul Strength 1 with no Attack requirement; ash staff Magic 1. Accuracy ratings are catalog metadata only for a future hit-chance model. No economy or price simulation exists.

## Planned shared back slot

Capes, magnetic backpack-quivers and resource sacks will compete for one back slot. Melee/magic capes have varied skill requirements and bonuses; gryphon/phoenix feather capes are high-level ranged alternatives; standard ranged gear is the magnetic recovery quiver. Material-specific sacks are storage, not resource generators, earned as rare server-validated gathering drops. These systems are design commitments, not implemented items in rc.9. They require a broader inventory conservation model, bank transfers and validated ammunition before rewards are introduced.

Character idle/movement and light/heavy cape profiles also remain future work. Seraphine still uses the retained static transparent artwork with the existing cosmetic bob/lean. Browser visual verification remains open; no production auth, cloud storage, PvP or rare-drop balance is claimed.
