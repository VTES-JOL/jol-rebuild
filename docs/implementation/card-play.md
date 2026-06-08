# Card Play — Implementation Status

> See [VTES Rules — Card Play](../rules/card-play.md) for the game rules this implements.

---

## Current Enforcement Status

Phase enforcement is not yet implemented. `PlayCard` currently accepts any card from `HAND` in any phase by whoever holds impulse. See [Mechanics Gaps § Card Play Phase Gating](./mechanics-gaps.md#12-card-play-phase-gating) for the full gap list and proposed work.

## Missing Enum Values

The following `CardType` enum values must be added before phase enforcement can be implemented:

- `CardType.CONVICTION` — currently maps to `CardType.NONE` in `GameInitService.toCardType()`
- `CardType.POWER` — currently maps to `CardType.NONE` in `GameInitService.toCardType()`

`CardType.LOCATION` exists in the enum but is unreachable via normal CSV import — location cards are typed as `MASTER` in the data.
