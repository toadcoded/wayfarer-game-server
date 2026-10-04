# Reconciliation record

Persistence source: exact Drive ZIP SHA-256 b0147afba8f57ce359aaccf602fc2847041521c0ae22e63e9ae2b07e37883996 (8,168,362 bytes, 456 files; CRC and 455 manifest entries checked).

Gameplay hardening source: prior ZIP SHA-256 e670dc78f35b0b3cf42cd7829be68a0c077d898dc259b40b5b73237e8393414a.

Both inputs used rc.5 labels for different source trees. rc.6 reconciles them without overwriting either input. The contract advances to simulation revision 6. The available-quest cooldown invariant required a join adjustment: available quests now use gatherReadyTick 0 even if the realm is already running; active resumed cooldowns remain relative.

New host fixes: pending-disconnect-save admission gate, bounded periodic queuing/admission, health fault on identity-store write failure, truthful shutdown failure, persistent-mode progress label. The old health-response test was updated to include the persistence field added by the imported branch.

This is still the local JSON/HMAC adapter. A production storage interface, transactional database, account provider and revocation/expiry design remain future work. Drive organization and sharing were not changed.
