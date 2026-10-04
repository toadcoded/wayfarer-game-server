# Xam — autonomous realm skiller · v0.9 rc.2

Xam is one server-controlled, player-like NPC who starts with the same fresh profile as a normal player: empty item inventory, empty resource pack/bank, level 1 skills except the game's standard level 10 Hitpoints baseline (1,154 XP). He is not pre-maxed and receives no custom XP grants.

His bounded routine rotates through all 23 actual practice drills, travels over checked navigation to gather logs/ore/fish, returns to camp to bank and attempt tool crafting, attempts the starter quest, claims/equips an earned Reed blade, attacks/guards in the shared Warden encounter and lights the landing beacon. Every movement and action is submitted through RealmRuntime.receive and committed by the same authoritative clock, range, cooldown, challenge, inventory and XP logic used for humans. The controller answers the marked server practice steps only after they become ready. Ranged and other unfinished systems currently use practice drills; Xam does not implement their missing full content loops. Content not yet built is not claimed as trained gameplay.

Xam shares the playable realm and its resource/encounter rules, so his activity can consume the shared reed patch and contribute to Warden combat. His XP, inventory, resource pack and bank are his own. He cannot trade or transfer those resources to humans. Human packets cannot bind to his reserved host connection. Trade, follow and injected connection fields are rejected by the existing strict action codec. The only new user interface action is Examine Xam, showing his current activity, total XP/level and banked resources. A noninteractive 3D nameplate identifies him; the 2D fallback also names him. His traveler appearance and training gesture are cosmetic read models. This pass adds no PvP targeting or attack option for Xam.

## Upkeep and persistence

`npm start` enables Xam automatically and stores his validated profile and routine cursor at `runtime/xam.json`. Set `XAM_DB` to a different server-owned path if needed. Human cookie profiles remain configured independently through `PROFILE_DB`. The programmatic test-host factory keeps Xam opt-in with `xam:true`; an optional `xamPath` enables his durable state.

Xam keeps the monotonic 20 Hz realm alive with zero human sockets. He receives a reserved extra actor slot while the configured human socket capacity remains unchanged. Upkeep uses the existing bounded catch-up clock and bounded path search; a blocked path is retried after a delay without teleporting or granting XP. Save writes are serialized and use temporary-file + atomic rename. Save schema validation is strict. Periodic and graceful-shutdown saves retain XP, items, bank and route cursor. Restart restores the last validated save without free offline XP or restoring an unfinished practice challenge. Corrupted saves fail startup; write failures fault health and stop ticking. Shared world state/unfinished fights are not durable in the current local host.

“24/7” means continuously while a healthy realm process runs. No cloud deployment or uptime guarantee is provided. If the computer/server is stopped, Xam stops. Backups and an external service supervisor are later deployment work. Only one autonomous XP-training controller is added; existing ambient villagers/wildlife remain cosmetic NPCs.

## Fresh evidence

The tests simulate 15,000 authoritative ticks (12.5 minutes) and confirm earned XP in every skill, gathered/banked resources and the legitimately earned equipped weapon. Separate tests cover real player coexistence, rejected control/trade/follow packets, replay, save/reopen without offline awards, empty-server upkeep, corrupt state and persistence failure. The real standalone CLI is launched without players, checked for a live tick/Xam endpoint, then stopped by SIGTERM and its saved profile validated. Read-only examination does not mutate realm state.

Actual browser/phone visual review of the nameplate/gestures remains open. This is a local v0.9 release candidate, not a production MMO deployment.
