# Actions — Implementation

Documents the formal action declaration, action lifecycle, NRA tracking, per-type resolution, and after-resolution protocol in JOL.

See [VTES Rules — Actions](../rules/actions.md) for the tabletop rules this implements.

For blocking and stealth/intercept enforcement, see [Blocking](./blocking.md). For the referendum engine, see [Referendums](./referendums.md). For the combat system, see [Combat](./combat.md). For card play timing and lifecycle, see [Card Play](./card-play.md). For the cross-workflow window order, see [Timing Windows](./timing-windows.md).

---

## Action Lifecycle

Every action in rules-enforced mode moves through the following states, tracked by `PendingActionState.status`:

```
DeclareAction
  → if an action card is played: open AS_PLAYED cancellation window
  → open AS_ANNOUNCED sequencing window (action-announcement effects only)
  → open block-attempt impulse window (DIRECTED_SINGLE or UNDIRECTED)
  [status: DURING_ACTION]

    ── all players pass without blocking ──▶  open BLOCKS_DECLINED pre-resolution impulse window
                                               → if target changes: return to block-attempt impulse window
                                               → all players pass with no target change
                                               → ResolveAction
                                               → apply resolution effects
                                               → set actionSuccessful = true
                                               → set reachedResolution = true (NRA locks)
                                               [status: AFTER_RESOLUTION]
                                               → open AFTER_RESOLUTION sequencing window
                                               → window closes → clear PendingActionState

    ── block attempt succeeds ──────────────▶  [status: BLOCKED]
                                               → open ACTION_BLOCK_RESOLUTION_PRE_COMBAT for explicit card-text hooks, if any
                                               → StartCombat (see Combat), unless block resolution is canceled/replaced
                                               → after combat: status → ACTION_CONTINUING or AFTER_RESOLUTION
                                               → open AFTER_RESOLUTION sequencing window
                                               → window closes → clear PendingActionState
```

`ACTION_CONTINUING` is set when a "continue the action" effect fires after combat (e.g. Form of Mist). The block-attempt impulse window re-opens with the same stealth/intercept accumulators intact.

For the expanded sequential ordering of action, combat, diablerie, referendum, and blood hunt windows, use [Timing Windows](./timing-windows.md). In particular, a diablerie action enters the diablerie workflow before the triggering action's `AFTER_RESOLUTION` window opens.

`ACTION_BLOCK_RESOLUTION_PRE_COMBAT` is not a general official phase. It is a narrow timing hook for card text explicitly playable after a successful block and before the resulting combat.

---

## Commands

| Command         | Fields                                        | Rules-enforced validation                                                                                            |
|-----------------|-----------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| `DeclareAction` | `actorRef`, `actionType`, `targetPlayerName?` | MINION phase; current player; actor in READY, unlocked, not contested; NRA check                                     |
| `AttemptBlock`  | `blockerRef`                                  | Impulse window active; blocker controller = current impulse holder; blocker eligible — see [Blocking](./blocking.md) |
| `ResolveAction` | —                                             | Blocks Declined pre-resolution window closed; action status = DURING_ACTION                                          |
| `AbortAction`   | —                                             | Action in progress; cancels action, unlocks actor, clears all state                                                  |

---

## PendingActionState

`PendingActionState` is stored on `GameData` while an action is in progress. All fields that carry accumulated modifiers persist across block windows and redirects.

| Field                        | Type                    | Notes                                                                                                                                                                                                                                            |
|------------------------------|-------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `actorRef`                   | `CardRef`               | Acting minion                                                                                                                                                                                                                                    |
| `actionType`                 | `ActionType`            | One of the `ActionType` enum values                                                                                                                                                                                                              |
| `targetPlayerName`           | `String?`               | Non-null for directed; null for undirected                                                                                                                                                                                                       |
| `status`                     | `ActionStatus`          | `DURING_ACTION` / `BLOCKED` / `AFTER_RESOLUTION` / `ACTION_CONTINUING`                                                                                                                                                                           |
| `blockerRef`                 | `CardRef?`              | Set when a block attempt succeeds                                                                                                                                                                                                                |
| `actionCardRef`              | `CardRef?`              | Card played as the action; remains in limbo until resolution — see [Card Play](./card-play.md)                                                                                                                                                   |
| `bleedAmount`                | `int`                   | Running bleed total including modifiers; starts at 1 for `BLEED` actions                                                                                                                                                                         |
| `reachedResolution`          | `boolean`               | NRA fires when this becomes true                                                                                                                                                                                                                 |
| `actionSuccessful`           | `boolean`               | True if action was not blocked                                                                                                                                                                                                                   |
| `bleedSuccessful`            | `boolean`               | True if bleed resolved for ≥ 1 pool; drives Edge movement. Note: VEKN card text saying "successful bleed" usually means the action was not blocked (`actionSuccessful`); this flag specifically covers the ≥ 1 pool condition for Edge transfer. |
| `referendumSuccessful`       | `boolean`               | True if referendum passed; drives "after successful referendum" effects                                                                                                                                                                          |
| `bleedLimitedUsed`           | `boolean`               | A `(limited)` bleed modifier has already been played this action                                                                                                                                                                                 |
| `stealth`                    | `int`                   | Running stealth total; carries across block windows and redirects — see [Blocking](./blocking.md)                                                                                                                                                |
| `interceptsByBlockerRef`     | `Map<CardRef, Integer>` | Per-blocker intercept map; carries across redirects — see [Blocking](./blocking.md)                                                                                                                                                              |
| `passedBlockWindowsByPlayer` | `Set<String>`           | Players who passed their current block window; reset on redirect — see [Blocking](./blocking.md)                                                                                                                                                 |
| `cannotBlockRefs`            | `Set<CardRef>`          | Minions with explicit "cannot block" restrictions for the duration of this action                                                                                                                                                                |
| `currentBlockerRef`          | `CardRef?`              | Active blocker during a current attempt; null when no attempt in progress                                                                                                                                                                        |
| `blocksDeclined`             | `boolean`               | True after all eligible blockers have declined and before action resolution; reset if the action target changes                                                                                                                                  |
| `wakePermissionByCardId`     | `Set<String>`           | Minion card IDs granted temporary wake permission — see [Blocking](./blocking.md)                                                                                                                                                                |

> **Implementation status:** `actorRef`, `actionType`, `targetPlayerName`, `status`, and `blockerRef` are on the Java class. All other fields in the table above are part of the target design and must be added before the corresponding feature can be enforced.

---

## ActionStatus Enum

| Value                | Java enum status  | Meaning                                                                                                                  |
|----------------------|-------------------|--------------------------------------------------------------------------------------------------------------------------|
| `DURING_ACTION`      | Exists            | Block-attempt impulse window open; acting minion locked                                                                  |
| `BLOCKED`            | Exists            | A block attempt succeeded; combat is in progress                                                                         |
| `AFTER_RESOLUTION`   | Exists            | Unblocked action resolved, or blocked action's combat/block resolution finished; AFTER_RESOLUTION sequencing window open |
| `ACTION_CONTINUING`  | **Must be added** | "Continue the action" effect fired after combat; re-entering block-attempt loop                                          |

> **Enum gap:** `ACTION_CONTINUING` is not yet in `src/main/java/…/enums/ActionStatus.java`. Add it before wiring the continue-the-action protocol path.

`AS_PLAYED` and `AS_ANNOUNCED` are sequencing-window types, not action statuses. `AS_PLAYED` applies to the card-play cancellation layer; `AS_ANNOUNCED` applies to action-announcement effects after the action exists.

> **Enum gap:** `AS_PLAYED` is not yet in `SequencingWindowType` (currently `AS_ANNOUNCED`, `AFTER_RESOLUTION`). Add it before wiring the declaration sequencing windows.

---

## Declaration Sequencing Windows

If an action card is played to declare the action, a `SequencingWindowState(AS_PLAYED)` opens first. This restricted window is for "as it is played" cancellers only (e.g. Direct Intervention) and wake effects needed to play effects in that window. The action card is not replaced until this window closes.

After `AS_PLAYED` closes, or immediately for a basic action that did not play a card, a `SequencingWindowState(AS_ANNOUNCED)` opens. This window is for effects usable as the action is announced. All players pass -> window closes -> block-attempt impulse window opens.

> **Gap:** `DeclareAction` currently opens the block-attempt impulse window directly, skipping both declaration windows. Inserting `AS_PLAYED` and `AS_ANNOUNCED` before the block-attempt window is tracked in [Mechanics Gaps](./mechanics-gaps.md) (P4 — AS_ANNOUNCED sequencing window).

---

## No Repeat Action (NRA) Tracking

NRA is tracked by `GameData.nraActionsByCardId: Map<String, Set<String>>` (cleared on `NextTurn`).

- **Key:** acting minion card ID (as UUID string).
- **Value:** set of NRA-scoped action keys that have reached resolution for that minion this turn.

### NRA scope — what is locked

| Action                              | NRA key                               |
|-------------------------------------|---------------------------------------|
| Basic bleed                         | `"BLEED"`                             |
| Political action                    | `"POLITICAL"`                         |
| Action card from hand               | Card name (e.g. `"Computer Hacking"`) |
| Action triggered by an in-play card | Card name of triggering card          |

### NRA scope — what is NOT locked

- HUNT, EQUIP (a different equipment card), EMPLOY_RETAINER (a different retainer), RECRUIT_ALLY (a different ally) — these are repeatable basic actions.
- Cancelled actions (never reach `reachedResolution`).

### NRA enforcement

On `DeclareAction`:
1. Compute the NRA key for this action/card.
2. If the minion's set in `nraActionsByCardId` already contains this key, reject the action.

On `ResolveAction`:
1. Set `reachedResolution = true` and add the NRA key before paying action costs.
2. If cost cannot be paid or targets are invalid, the action **fizzles**: the action card (if any) moves from limbo to `ASH_HEAP` via `CardMovedEffect`; the acting minion remains locked until the AFTER_RESOLUTION window closes; the AFTER_RESOLUTION sequencing window still opens so "after this action" effects may fire; no pool/blood is paid.

NRA locks persist through mid-turn unlocks.

---

## Per-ActionType Resolution

`ResolveAction` applies these effects based on `actionType`:

| ActionType        | Resolution effects                                                                                                                                                                                                                                                                                           |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BLEED`           | `PlayerPoolChangedEffect(targetPlayer, -bleedAmount)`; if `bleedAmount ≥ 1` → `EdgeChangedEffect(actingPlayer)` and set `bleedSuccessful = true`. Edge and the flag fire on `bleedAmount ≥ 1` regardless of whether the target has pool remaining — they follow the bleed amount, not the actual pool delta. |
| `HUNT`            | `CardCounterChangedEffect(actor, +min(1, capacity - counters))` — capped at capacity                                                                                                                                                                                                                         |
| `EQUIP`           | `CardAttachedEffect(equipment, actor)` — equipment identified in declaration                                                                                                                                                                                                                                 |
| `EMPLOY_RETAINER` | `CardAttachedEffect(retainer, actor)` — retainer brought in with life counters per card text                                                                                                                                                                                                                 |
| `RECRUIT_ALLY`    | `CardMovedEffect(ally, actingPlayer, READY)` + add ally card ID to `GameData.recruitedThisTurn: Set<String>`; `DeclareAction` rejects an actor whose card ID is in this set; cleared on `NextTurn`                                                                                                           |
| `POLITICAL`       | Open `ReferendumState` and suspend action completion until the referendum resolves — see [Referendums](./referendums.md)                                                                                                                                                                                     |
| `LEAVE_TORPOR`    | `CardCounterChangedEffect(actor, -2)`; then `CardMovedEffect(actor, READY)` — actor must be in TORPOR and have ≥ 2 blood; if cost cannot be paid, action fizzles                                                                                                                                             |
| `RESCUE`          | `CardMovedEffect(target, actingPlayer, READY)` — target specified in declaration; no blood cost for the rescuing minion                                                                                                                                                                                      |
| `DIABLERISE`      | Full diablerie sequence — see [Combat § Diablerie](./combat.md#diablerie)                                                                                                                                                                                                                                    |
| `CUSTOM`          | No automatic engine effect; players handle manually                                                                                                                                                                                                                                                          |

---

## Action Success Layers

Three independent success flags on `PendingActionState`:

| Flag                   | True when                                        | Drives                                                                |
|------------------------|--------------------------------------------------|-----------------------------------------------------------------------|
| `actionSuccessful`     | Action reached resolution (not blocked)          | "After a successful action" card effects                              |
| `bleedSuccessful`      | Bleed action resolved for ≥ 1 pool               | Edge movement; "after a successful bleed" card effects                |
| `referendumSuccessful` | Referendum passed at the end of political action | "After a successful referendum" card effects (e.g. Voter Captivation) |

---

## After-Resolution Window

`ResolveAction` opens a `SequencingWindowState(AFTER_RESOLUTION)` for unblocked actions. Blocked actions open the same window after combat or block resolution completes. Legal effects include "after action resolution", "after this action", "after block resolution" when a block occurred, "after successful action", "after successful bleed", and "after successful referendum" effects whose trigger preconditions are currently true. ABC priority order applies. When the window closes, `PendingActionState` is cleared.

For political actions, `ResolveAction(POLITICAL)` opens the referendum subworkflow and suspends action completion. `ACTION_AFTER_RESOLUTION` opens only after `ClosePolling` resolves the referendum and any outcome-dependent referendum hooks have completed.

---

## Basic Action Stealth Defaults

For reference when enforcing stealth/intercept:

| Action                               | Default stealth |
|--------------------------------------|-----------------|
| Bleed                                | +0              |
| Hunt                                 | +1              |
| Equip                                | +1              |
| Employ Retainer                      | +1              |
| Recruit Ally                         | +1              |
| Political Action                     | +1              |
| Leave Torpor (acting from torpor)    | +1              |
| Rescue (targeted ally of controller) | +1              |

Stealth defaults are additive with any modifiers played during the action.
