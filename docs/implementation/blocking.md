# Blocking — Implementation Status

Documents block attempt enforcement, stealth/intercept tracking, directed vs undirected action eligibility, and action redirects in JOL.

See [VTES Rules — Blocking](../rules/blocking.md) for the tabletop rules this implements.

For the broader action lifecycle, see [Actions](./actions.md). For combat after a successful block, see [Combat](./combat.md).

---

## Current Status

`AttemptBlock` exists and marks the action as BLOCKED, locking the blocker. It currently treats every block attempt as automatically successful — no stealth vs intercept comparison is performed, and no directed/undirected eligibility check is applied. Any non-acting unlocked ready minion can currently block any action.

---

## Missing Mechanics

### Directed / Undirected Blocking Eligibility

| Mechanic                                                                                                | Notes                                                            |
|---------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Directed `(D)` action blocking — only the target Methuselah's minions may attempt                       | Not enforced; any minion can currently block                     |
| Undirected blocking — prey first, then predator; no other Methuselahs unless card text allows           | Pass order not enforced                                          |
| Block opportunity passes to the next eligible Methuselah after all of the current Methuselah's attempts | Not modeled                                                      |
| Explicit "cannot block" restrictions from card effects persist for the full action                      | Not tracked; `cannotBlockRefs` missing from `PendingActionState` |

### Stealth / Intercept Accumulation

Neither stealth nor intercept is tracked on `PendingActionState`. The "only when needed" rule cannot be enforced.

Base stealth is 0; base intercept is 0 for most minions (some have printed intercept values). The comparison at the end of a block attempt is: block succeeds if blocker's final intercept ≥ acting minion's final stealth.

Key model requirements:

| State field                  | Description                                                                       |
|------------------------------|-----------------------------------------------------------------------------------|
| `stealth`                    | Action-wide running stealth total; carries across block windows and redirects     |
| `interceptsByBlockerRef`     | Per-blocker intercept map; carries forward across redirected block windows        |
| `passedBlockWindowsByPlayer` | Which players have declined further block attempts in the current block window    |
| `cannotBlockRefs`            | Minions with explicit "cannot block" restrictions for the duration of this action |
| `currentBlockerRef`          | Active blocker during a block attempt (null if no active attempt)                 |

After each stealth or intercept effect resolves, the comparison must be recalculated before allowing another stealth or intercept play. Optional intercept on a vampire is not automatic — the controlling player must choose to apply it.

### Block Redirect

When a reaction card redirects an action to a new target:

- All accumulated modifiers (stealth, intercept, bleed amount) must carry over; nothing resets.
- A new block window opens for the new target Methuselah.
- Players who passed in a prior block window are eligible again in the new window — the prior pass applies only to the window in which it was made.
- Minions with an explicit "cannot block" restriction remain ineligible for the full action.

This requires `stealth` and `interceptsByBlockerRef` on `PendingActionState`, and `passedBlockWindowsByPlayer` to track per-window pass decisions.

### Action Continuing

`ActionStatus` is missing the `ACTION_CONTINUING` value. This status is required when a "continue the action" effect fires after blocked combat (e.g. Form of Mist), causing the game to re-enter the block-attempt loop before After Resolution.

Required for:
- Firing "after combat ends" and "after block resolution" effects in the Action Continuing window
- Returning to block attempts without re-opening the full As Announced or During Action windows
- Cats' Guidance and similar cards that trigger on block resolution remaining valid after action continuation

### Wake Effects

Wake-effect card plays are not enforced. The engine has no model of a locked minion gaining temporary "react as though unlocked" permission via a wake card (e.g. On the Qui Vive, Forced Awakening).

Enforcing this requires:
- Recognising a card play as a wake effect at declaration time
- Granting the locked minion temporary eligibility to play reactions and attempt blocks for the duration of the action
- Applying any additional lock/unlock or penalty text when the action ends