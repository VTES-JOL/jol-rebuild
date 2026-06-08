# Card Play — Implementation Status

Documents card play enforcement: phase gating, card type lifecycle, out-of-turn masters, conviction, limited effects, and master subtypes in JOL.

See [VTES Rules — Card Timing and Card Types](../rules/card-play.md) for the tabletop rules this implements.

---

## Current Status

Phase enforcement is not yet implemented. `PlayCard` currently accepts any card from `HAND` in any phase by whoever holds impulse. Card destination, cost, replacement timing, and cancellation are all caller-controlled with no server validation.

---

## Missing Enum Values

The following `CardType` enum values must be added before phase enforcement can be implemented:

| Type                  | Current state                                             |
|-----------------------|-----------------------------------------------------------|
| `CardType.CONVICTION` | Maps to `CardType.NONE` in `GameInitService.toCardType()` |
| `CardType.POWER`      | Maps to `CardType.NONE` in `GameInitService.toCardType()` |

`CardType.LOCATION` exists in the enum but is unreachable via normal CSV import — location cards are typed as `MASTER` in the data.

---

## Missing Mechanics

### Card Play Phase Gating

| Mechanic                                                                                                                                     | Notes                                                            |
|----------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `PlayCard` source-region enforcement                                                                                                         | No source-region check; any referenced card can be played        |
| `PlayCard` phase enforcement by card type (Master / Minion / Unlock / Discard)                                                               | No phase check; any card can be played in any phase              |
| Action Modifier restricted to acting player; Reaction restricted to non-acting players                                                       | Not enforced                                                     |
| Out-of-turn Master detection (`CardData.outOfTurn` flag)                                                                                     | Not derived from card text at build time                         |
| Out-of-turn master action cost (uses next master phase action; one per window between turns)                                                 | No `masterActionsRemaining` on `GameData`                        |
| Card replacement / draw-to-max timing                                                                                                        | Not modeled                                                      |
| Card cancellation and "as played" replacement                                                                                                | Not modeled                                                      |
| Card destination after play                                                                                                                  | Caller chooses region; card-text destination patterns not parsed |
| Limited effect/card tracking — at most one `(limited)` bleed modifier; at most one `(limited)` additional-strike source per minion per round | No per-action or per-combat-round record of limited sources used |
| Conviction cards playable from `ASH_HEAP`                                                                                                    | Requires card-type support and explicit source-region exception  |

### Proposed Implementation Work

- Add `CONVICTION` and `POWER` to `CardType` enum; update `toCardType()` in `GameInitService.java`.
- Add `outOfTurn` boolean to `CardData`; populate in `GameInitService.buildCard()` by checking card text for `"out-of-turn"`.
- Add `masterActionsRemaining` to `GameData`; set to 1 on `MASTER` phase entry; deducted by each master play and out-of-turn master plays against the player's next master phase.
- Add source-region, phase, card-type, actor, timing, cost, replacement, and destination guards in `CardMovementHandler.handlePlayCard()`.
- Extend allowed source regions for Conviction: check `ASH_HEAP` in addition to `PLAYABLE_REGIONS`.
- Update `CardContextMenu` in frontend to show Play only when phase matches card type.

---

## Trophy, Investment, and Path Subtypes

Three master card subtypes have distinct in-play rules that are not yet specified or implemented.

| Subtype        | Rule                                                                                                                                                                                          |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Trophy**     | Awarded through Red List rules when a qualifying vampire burns a Red List minion in combat or as a directed action, including diablerie. Trophy handling must follow each Trophy card's text. |
| **Investment** | Enters play with blood counters from the bank. During the controller's master phase, blood may be moved from the Investment to a qualifying vampire. Burned when no blood remains.            |
| **Path**       | Represents a vampire's moral path. A vampire can have at most one Path attached. Some paths affect costs, abilities, or sect status of the bearer.                                            |

**Proposed work:** Add `masterSubtype` (enum: `STANDARD`, `TRIFLE`, `TROPHY`, `INVESTMENT`, `PATH`, `LOCATION`, `WATCHTOWER`, `OUT_OF_TURN`) to `CardData`; detect from card text at build time. The `Hunting ground` location subtype (relevant to hunt resolution in [Actions](./actions.md#hunting-ground-bonus)) should also be detectable via this mechanism.