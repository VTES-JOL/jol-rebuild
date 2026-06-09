# Actions — Implementation

Documents the formal action declaration, action lifecycle, NRA tracking, per-type resolution, and after-resolution protocol in JOL.

See [VTES Rules — Actions](../rules/actions.md) for the tabletop rules this implements.

For blocking and stealth/intercept enforcement, see [Blocking](./blocking.md). For the referendum engine, see [Referendums](./referendums.md). For the combat system, see [Combat](./combat.md). For card play timing and lifecycle, see [Card Play](./card-play.md).

---

## Action Lifecycle

Every action in rules-enforced mode moves through the following states, tracked by `PendingActionState.status`:

```
DeclareAction
  → open AS_ANNOUNCED sequencing window (cancellers only)
  → AS_ANNOUNCED closes
  → open block-attempt impulse window (DIRECTED_SINGLE or UNDIRECTED)
  [status: DURING_ACTION]

    ── all players pass without blocking ──▶  ResolveAction
                                               → apply resolution effects
                                               → set actionSuccessful = true
                                               → set reachedResolution = true (NRA locks)
                                               [status: AFTER_RESOLUTION]
                                               → open AFTER_RESOLUTION sequencing window
                                               → window closes → clear PendingActionState

    ── block attempt succeeds ──────────────▶  [status: BLOCKED]
                                               → StartCombat (see Combat)
                                               → after combat: status → ACTION_CONTINUING or clear
```

`ACTION_CONTINUING` is set when a "continue the action" effect fires after combat (e.g. Form of Mist). The block-attempt impulse window re-opens with the same stealth/intercept accumulators intact.

---

## Commands

| Command         | Fields                                        | Rules-enforced validation                                                                 |
|-----------------|-----------------------------------------------|-------------------------------------------------------------------------------------------|
| `DeclareAction` | `actorRef`, `actionType`, `targetPlayerName?` | MINION phase; current player; actor in READY, unlocked, not contested; NRA check          |
| `AttemptBlock`  | `blockerRef`                                  | Impulse window active; blocker controller = current impulse holder; blocker eligible — see [Blocking](./blocking.md) |
| `ResolveAction` | —                                             | Impulse window closed; action status = DURING_ACTION                                      |
| `AbortAction`   | —                                             | Action in progress; cancels action, unlocks actor, clears all state                       |

---

## PendingActionState

`PendingActionState` is stored on `GameData` while an action is in progress. All fields that carry accumulated modifiers persist across block windows and redirects.

| Field                        | Type                        | Notes                                                                                                      |
|------------------------------|-----------------------------|------------------------------------------------------------------------------------------------------------|
| `actorRef`                   | `CardRef`                   | Acting minion                                                                                              |
| `actionType`                 | `ActionType`                | One of the `ActionType` enum values                                                                        |
| `targetPlayerName`           | `String?`                   | Non-null for directed; null for undirected                                                                 |
| `status`                     | `ActionStatus`              | `DURING_ACTION` / `BLOCKED` / `AFTER_RESOLUTION` / `ACTION_CONTINUING`                                    |
| `blockerRef`                 | `CardRef?`                  | Set when a block attempt succeeds                                                                          |
| `actionCardRef`              | `CardRef?`                  | Card played as the action; remains in limbo until resolution — see [Card Play](./card-play.md)             |
| `bleedAmount`                | `int`                       | Running bleed total including modifiers; starts at 1 for `BLEED` actions                                  |
| `reachedResolution`          | `boolean`                   | NRA fires when this becomes true                                                                           |
| `actionSuccessful`           | `boolean`                   | True if action was not blocked                                                                             |
| `bleedSuccessful`            | `boolean`                   | True if bleed resolved for ≥ 1 pool; drives Edge movement                                                 |
| `referendumSuccessful`       | `boolean`                   | True if referendum passed; drives "after successful referendum" effects                                    |
| `bleedLimitedUsed`           | `boolean`                   | A `(limited)` bleed modifier has already been played this action                                          |
| `stealth`                    | `int`                       | Running stealth total; carries across block windows and redirects — see [Blocking](./blocking.md)          |
| `interceptsByBlockerRef`     | `Map<CardRef, Integer>`     | Per-blocker intercept map; carries across redirects — see [Blocking](./blocking.md)                       |
| `passedBlockWindowsByPlayer` | `Set<String>`               | Players who passed their current block window; reset on redirect — see [Blocking](./blocking.md)          |
| `cannotBlockRefs`            | `Set<CardRef>`              | Minions with explicit "cannot block" restrictions for the duration of this action                         |
| `currentBlockerRef`          | `CardRef?`                  | Active blocker during a current attempt; null when no attempt in progress                                 |
| `wakePermissionByCardId`     | `Set<String>`               | Minion card IDs granted temporary wake permission — see [Blocking](./blocking.md)                         |

Currently implemented: `actorRef`, `actionType`, `targetPlayerName`, `status`, `blockerRef`. All other fields are not yet on the Java class.

---

## ActionStatus Enum

| Value               | Meaning                                                                       |
|---------------------|-------------------------------------------------------------------------------|
| `DURING_ACTION`     | Block-attempt impulse window open; acting minion locked                       |
| `BLOCKED`           | A block attempt succeeded; combat is in progress                              |
| `AFTER_RESOLUTION`  | Action reached resolution; AFTER_RESOLUTION sequencing window open            |
| `ACTION_CONTINUING` | "Continue the action" effect fired after combat; re-entering block-attempt loop |

`AS_ANNOUNCED` was previously reserved in the enum but is now replaced by the AS_ANNOUNCED sequencing window (see below); the enum value may be repurposed or removed.

---

## AS_ANNOUNCED Sequencing Window

After `DeclareAction` and before opening the block-attempt impulse window, a `SequencingWindowState(AS_ANNOUNCED)` opens. This window is for "as it is played" cancellers only (e.g. Direct Intervention). All players pass → window closes → block-attempt impulse window opens.

Currently: `DeclareAction` opens the block-attempt impulse window directly, skipping this step. AS_ANNOUNCED sequencing must be inserted between declaration and the impulse window.

---

## No Repeat Action (NRA) Tracking

NRA is tracked by `GameData.nraActionsByCardId: Map<String, Set<String>>` (cleared on `NextTurn`).

- **Key:** acting minion card ID (as UUID string).
- **Value:** set of NRA-scoped action keys that have reached resolution for that minion this turn.

### NRA scope — what is locked

| Action                                        | NRA key                              |
|-----------------------------------------------|--------------------------------------|
| Basic bleed                                   | `"BLEED"`                            |
| Political action                              | `"POLITICAL"`                        |
| Action card from hand                         | Card name (e.g. `"Computer Hacking"`) |
| Action triggered by an in-play card           | Card name of triggering card         |

### NRA scope — what is NOT locked

- HUNT, EQUIP (a different equipment card), EMPLOY_RETAINER (a different retainer), RECRUIT_ALLY (a different ally) — these are repeatable basic actions.
- Cancelled actions (never reach `reachedResolution`).
- Actions that fizzle at resolution.

### NRA enforcement

On `DeclareAction`:
1. Compute the NRA key for this action/card.
2. If the minion's set in `nraActionsByCardId` already contains this key, reject the action.

On `ResolveAction`:
1. Set `reachedResolution = true`.
2. Add the NRA key to the minion's set in `nraActionsByCardId`.

NRA locks persist through mid-turn unlocks.

---

## Per-ActionType Resolution

`ResolveAction` applies these effects based on `actionType`:

| ActionType        | Resolution effects                                                                                                                                             |
|-------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BLEED`           | `PlayerPoolChangedEffect(targetPlayer, -bleedAmount)`; if `bleedAmount ≥ 1` → `EdgeChangedEffect(actingPlayer)`; set `bleedSuccessful = true`                 |
| `HUNT`            | `CardCounterChangedEffect(actor, +min(1, capacity - counters))` — capped at capacity                                                                          |
| `EQUIP`           | `CardAttachedEffect(equipment, actor)` — equipment identified in declaration                                                                                  |
| `EMPLOY_RETAINER` | `CardAttachedEffect(retainer, actor)` — retainer brought in with life counters per card text                                                                   |
| `RECRUIT_ALLY`    | `CardMovedEffect(ally, actingPlayer, READY)` + flag ally unable to act this turn                                                                               |
| `POLITICAL`       | Open `ReferendumState` — see [Referendums](./referendums.md)                                                                                                  |
| `LEAVE_TORPOR`    | `CardCounterChangedEffect(actor, -2)`; then `CardMovedEffect(actor, READY)` — actor must be in TORPOR and have ≥ 2 blood; if cost cannot be paid, action fizzles |
| `RESCUE`          | `CardMovedEffect(target, actingPlayer, READY)` — target specified in declaration; no blood cost for the rescuing minion                                       |
| `DIABLERISE`      | Full diablerie sequence — see [Combat § Diablerie](./combat.md#diablerie)                                                                                     |
| `CUSTOM`          | No automatic engine effect; players handle manually                                                                                                            |

---

## Action Success Layers

Three independent success flags on `PendingActionState`:

| Flag                   | True when                                          | Drives                                                         |
|------------------------|----------------------------------------------------|----------------------------------------------------------------|
| `actionSuccessful`     | Action reached resolution (not blocked)            | "After a successful action" card effects                       |
| `bleedSuccessful`      | Bleed action resolved for ≥ 1 pool                 | Edge movement; "after a successful bleed" card effects         |
| `referendumSuccessful` | Referendum passed at the end of political action   | "After a successful referendum" card effects (e.g. Voter Captivation) |

---

## After-Resolution Window

`ResolveAction` opens a `SequencingWindowState(AFTER_RESOLUTION)`. Only "after action resolution" / "after successful action" / "after successful bleed" / "after successful referendum" effects are legal here. ABC priority order applies. When the window closes, `PendingActionState` is cleared.

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
