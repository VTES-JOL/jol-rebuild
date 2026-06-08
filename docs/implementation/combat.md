# Combat — Implementation Status

> See [VTES Rules — Combat](../rules/combat.md) for the full combat rules.

---

## Current Status

Combat is not yet formally enforced. The game engine tracks `pendingCombat` state but does not step through the seven-round sequence. Players currently simulate combat manually through counter adjustments and the `MoveToTorpor` / `BurnMinion` commands.

See [Mechanics Gaps § Combat System](./mechanics-gaps.md#3-combat-system) for the full gap analysis and proposed commands (`EnterCombat`, `Maneuver`, `DeclareStrike`, `ResolveStrikes`, `ApplyDamage`, `Press`, `EndCombat`).
