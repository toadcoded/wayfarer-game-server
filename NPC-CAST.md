# rc.23 · People of the causeway

Eight friendly NPCs based on the supplied prototype sheet now inhabit the playable causeway landings. These are procedural faceted models, not imported or rigged meshes extracted from the reference image.

| Character | Role | Visual details |
| --- | --- | --- |
| Halden | Lantern Guide | Grey beard, broad hat, blue/gold cape, lantern, satchel |
| Pin | Clockwork Child | Ginger hair, goggles, red scarf, small rig, clockwork rabbit nearby |
| Mirella | Apothecary | Green hat and outfit, pale flower trim, long hair, blue herbal flask |
| Branik | Woodcutter | Strong build, beard, green outfit, working axe, chopping and sneeze gestures |
| Sister Elowen | Shrine Keeper | Pale hair, blue hood, cream robe, moon badge, lantern |
| Tovik | Tavern Host | Strong build, moustache, apron, red neckerchief, tankard |
| Yarrow | Graveyard Warden | Long grey hair, dark hat, olive/purple outfit, staff, skull badge, lantern |
| Kestrel | Sky Courier | Goggles, red scarf, blue/gold outfit, messenger satchel, wave gesture |

Placement uses navigation-checked grounded positions, bounded retries and fixed ordering. The seven added/renamed ambient actors remain off the centre walking lane, separated by at least 1.8 metres and outside the hostile far-landing encounter's four-metre pulse. Halden remains the existing camp anchor. Pin and Branik reuse the existing child and woodcutter; no duplicate actors are created. The hostile Lantern Warden is a separate encounter and is not Yarrow.

The living-realm HUD offers a Talk button within three metres, checked again when pressed. Dialogue is fixed local flavour text and sends no gameplay packets. Halden's existing server-owned quest/bank mechanics continue through their existing controls. Apothecary shops, tavern services, shrine restoration, courier jobs and graveyard quests are not implemented by this pass. NPC outfits and terrain dressing are cosmetic, non-pickable and noncolliding; they do not grant XP, loot or inventory capacity. Two-dimensional fallback shows names and base character sprites rather than matching the new 3D outfits.

The existing articulated character rigs drive gestures and cape motion. Accessory materials are owned and disposed with each rig. No new services, authentication stack, database migrations or protocol changes are introduced. Simulation contract remains revision 14 and profile save schema remains revision 5.

Visual limitations: these are a first procedural interpretation of the reference. Hair braids, embroidered cape motifs, a raven companion and full unique skeletal animation sets remain future art work. Real Chromium/WebGL and phone visual/performance review remain open; NullEngine checks are not GPU screenshot evidence.
