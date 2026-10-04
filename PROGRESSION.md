# rc.18 progression integration

XP(L)=floor(sum(n=1..L−1,floor(n+300*2^(n/7)))/4). Immutable thresholds are computed once for1–99; binary search yields the level. No client-provided level is accepted. xpProgress derives next threshold, remaining XP, fraction and maxed state. XP storage cap200000000 is separate from the13,034,431 threshold for99.

Combat=floor((Defence+Hitpoints+floor(Prayer/2))/4+.325*max(Attack+Strength,floor(Ranged*1.5),floor(Magic*1.5))), bounded3–126. The highest offence branch prevents hybrid offence skills from stacking combat bracket inflation.15 independent tier bands remain1,7,14,21,28,35,42,49,56,63,70,77,84,91,99. An item's requirements still differ from its tier, speed and identity.

Server combat bonuses: Strength/Magic adds floor((level−1)/10) damage; Defence reduces Warden pulse by floor((level−1)/20); maxHealth=40+max(0,Hitpoints−10). Gathering cooldown=40−floor((level−1)/5) ticks, lower bounded20; capped99 currently yields21ticks. Tool yield remains1/2/3 by crafted tool tier. Artisan level2 threshold83; Masterwork level5 threshold388. Existing recipes/resources/essence requirements remain.

All23 skills have strict integer XP, bonus directory, tier/requirement functions and durable carry-over. Active gameplay: existing combat modes, Hitpoints damage XP, three professions. Ranged/Prayer and13 other professions have progression records and requirement metadata only; their actions and effects are not invented. Accuracy ratings are computed but not yet used by the guaranteed-hit introductory Warden. No client XP-grant endpoint exists; generic XP award helpers are host/domain APIs for future validated activities. Prayer currently has no earning loop, so naturally reaching126 will require that later content.

Migration accepts only exact legacy fields, validates legacy XP<=960400 and adds fields without rewriting earned XP. Current schema4 strictly requires seven combat and16 noncombat keys. Save version4 and simulation12 are distinct. Client snapshots remain private per recipient. Interrupted/failed server ticks retain the prior whole gameplay state. Fresh replay capture validates the new state; historical contract11 replay files remain historical.

Reference curve checked against the classic experience thresholds; formula independently implemented. Numeric thresholds are also documented at https://runescape.wiki/w/Experience . No external skill assets or game implementation code was copied.
