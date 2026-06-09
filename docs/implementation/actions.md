# Actions — Implementation Status

Documents the formal action declaration, action lifecycle, NRA tracking, and after-resolution protocol in JOL.

See [VTES Rules — Actions](../rules/actions.md) for the tabletop rules this implements.

For blocking and stealth/intercept enforcement, see [Blocking](./blocking.md). For the referendum engine, see [Referendums](./referendums.md). For the combat system, see [Combat](./combat.md). For card-play timing and lifecycle, see [Card Play](./card-play.md).

---

## Current Status

A basic action skeleton exists. `DeclareAction`, `AttemptBlock`, `ResolveAction`, and `AbortAction` are implemented with `PendingActionState` on `GameData`. These commands are available in rules-enforced mode only.

Action-specific resolution (bleed pool loss, hunt blood gain, etc.), NRA tracking, block redirect, and the AS_ANNOUNCED sequencing window are all missing. See [Mechanics Gaps — Implementation Priority](./mechanics-gaps.md#implementation-priority) for prioritisation.

---

## Implemented Commands

| Command         | Fields                                        | Description                                                                                                                                       |
|-----------------|-----------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `DeclareAction` | `actorRef`, `actionType`, `targetPlayerName?` | Lock actor, set `PendingActionState` (DURING_ACTION), open impulse window. Rules-checked: MINION phase, current player, minion not locked         |
| `AttemptBlock`  | `blockerRef`                                  | Lock blocker, mark action BLOCKED, close impulse window; currently treats every block as automatically successful — see [Blocking](./blocking.md) |
| `ResolveAction` | —                                             | Mark AFTER_RESOLUTION; open After Resolution sequencing window                                                                                    |
| `AbortAction`   | —                                             | Cancel action; unlock actor; close impulse and sequencing windows                                                                                 |

`ActionType` enum values: `BLEED`, `HUNT`, `EQUIP`, `EMPLOY_RETAINER`, `RECRUIT_ALLY`, `POLITICAL`, `LEAVE_TORPOR`, `RESCUE`, `DIABLERISE`, `CUSTOM`.

---

## PendingActionState

`PendingActionState` is stored on `GameData` while an action is in progress.

| Field                        | Implemented? | Notes                                                                                                      |
|------------------------------|:------------:|------------------------------------------------------------------------------------------------------------|
| `actorRef`                   |      ✓       | CardRef of the acting minion                                                                               |
| `actionType`                 |      ✓       | One of the `ActionType` enum values                                                                        |
| `targetPlayerName`           |      ✓       | Non-null for directed actions; null for undirected                                                         |
| `status`                     |      ✓       | `DURING_ACTION` / `BLOCKED` / `AFTER_RESOLUTION`                                                           |
| `blockerRef`                 |      ✓       | Set when a block attempt succeeds                                                                          |
| `actionCardRef`              |      ✗       | Card being played as the action, if any; remains in limbo until resolution                                 |
| `bleedAmount`                |      ✗       | Running bleed total for bleed actions, including modifiers and reactions                                   |
| `reachedResolution`          |      ✗       | Whether the action reached Complete Action (NRA fires here)                                                |
| `actionSuccessful`           |      ✗       | True when the action was not blocked; distinct from bleed/referendum success                               |
| `bleedSuccessful`            |      ✗       | True when a bleed resolves for 1+ pool damage and should move the Edge                                     |
| `stealth`                    |      ✗       | Action-wide running stealth total; carries across block windows/redirects — see [Blocking](./blocking.md)  |
| `interceptsByBlockerRef`     |      ✗       | Per-blocker intercept map; carries forward across redirected block windows — see [Blocking](./blocking.md) |
| `passedBlockWindowsByPlayer` |      ✗       | Which players have passed their current block window — see [Blocking](./blocking.md)                       |
| `cannotBlockRefs`            |      ✗       | Minions with explicit "cannot block" restrictions for this action — see [Blocking](./blocking.md)          |
| `currentBlockerRef`          |      ✗       | Active blocker during a block attempt (null if no active attempt)                                          |

`ActionStatus` is also missing `ACTION_CONTINUING`, which is required for continued-action effects (e.g. Form of Mist) that re-enter the block-attempt loop after combat.

---

## Missing Mechanics

### Action Declaration and Lifecycle

| Mechanic                                                                                          | Rulebook reference          |
|---------------------------------------------------------------------------------------------------|-----------------------------|
| AS_ANNOUNCED sequencing window for "as it is played" cancellers (e.g. Direct Intervention)        | Card Play — Declaration     |
| Action-card limbo state (card leaves hand on declaration, not yet in ash heap until resolution)   | Card Play — Action          |
| Action cost paid at resolution, not on declaration; blocked actions do not pay cost               | Card Play — Cost            |
| Fizzle handling when cost cannot be paid or targets are no longer valid at resolution             | Card Play — Fizzle          |
| `ACTION_CONTINUING` status for continued-action effects that re-enter block attempts after combat | Actions — Action Continuing |

### Basic Action Resolution

`ResolveAction` does not yet apply action-type-specific effects:

| ActionType        | Missing resolution                                                                   |
|-------------------|--------------------------------------------------------------------------------------|
| `BLEED`           | Burn pool from target equal to bleed amount; move Edge if bleed amount ≥ 1           |
| `HUNT`            | Add blood to acting vampire up to capacity                                           |
| `EQUIP`           | Attach equipment card from hand or from another controlled minion                    |
| `EMPLOY_RETAINER` | Attach retainer card with life counters                                              |
| `RECRUIT_ALLY`    | Place ally in ready region with life counters; flag as unable to act this turn       |
| `POLITICAL`       | Initiate referendum polling — see [Referendums](./referendums.md)                    |
| `LEAVE_TORPOR`    | Pay 2 blood; move vampire to ready region                                            |
| `RESCUE`          | Rescue a torpored vampire controlled by the acting player                            |
| `DIABLERISE`      | Full diablerie resolution — see [Combat § Diablerie](./combat.md#diablerie)          |

### Action Success Layers

No separate tracking exists for action-level success, bleed success, or referendum success. Required for "after a successful action", "after a successful bleed", and "after a successful referendum" card effects.

| Field                  | Required for                                          |
|------------------------|-------------------------------------------------------|
| `actionSuccessful`     | Any card that triggers "after a successful action"    |
| `bleedSuccessful`      | Edge movement; "after a successful bleed" effects     |
| `referendumSuccessful` | Voter Captivation, Lutz von Hohenzollern, and similar |

### No Repeat Action (NRA)

NRA tracking is entirely absent. There is no per-minion record of which action types or named action cards have reached resolution this turn. The NRA lock must persist through mid-turn unlocks.

**Proposed state:** Add `nraActionsByMinionRef` to `GameData` (or a turn-scoped structure) as a map from `CardRef` to set of locked action names/types.

---

## Proposed Additional State

| State field             | Owner                 | Description                                           |
|-------------------------|-----------------------|-------------------------------------------------------|
| `actionCardRef`         | `PendingActionState`  | Card being played as the action, if any               |
| `bleedAmount`           | `PendingActionState`  | Running bleed total including modifiers               |
| `reachedResolution`     | `PendingActionState`  | Whether NRA fires (action reached Complete Action)    |
| `actionSuccessful`      | `PendingActionState`  | True when the action was not blocked                  |
| `bleedSuccessful`       | `PendingActionState`  | True when bleed resolves for ≥ 1 pool                 |
| `nraActionsByMinionRef` | `GameData` turn state | Per-minion, per-turn set of locked action names/types |
