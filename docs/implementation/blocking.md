# Blocking — Implementation

Documents block attempt enforcement, stealth/intercept tracking, directed vs undirected eligibility, wake effects, and action redirects in JOL.

See [VTES Rules — Blocking](../rules/blocking.md) for the tabletop rules this implements.

For the broader action lifecycle, see [Actions](./actions.md). For combat after a successful block, see [Combat](./combat.md).

---

## Current Status

`AttemptBlock` exists and marks the action as BLOCKED, locking the blocker. Currently every block attempt is automatically successful — no stealth vs intercept comparison is performed, no directed/undirected eligibility check is applied, and any unlocked non-acting minion can block any action.

---

## Directed and Undirected Eligibility

Eligibility is derived from `PendingActionState.targetPlayerName`:

- **Non-null** (directed action): only minions controlled by `targetPlayerName` may attempt to block, unless a card in play explicitly allows another Methuselah to block.
- **Null** (undirected action): prey first, then predator; no other Methuselahs may block unless card text explicitly permits.

The existing `HandlerUtils.buildPassOrder(DIRECTED_SINGLE / UNDIRECTED, actingPlayer, targetPlayerName)` already computes the correct impulse pass order. `AttemptBlock` must validate that the blocker's controller matches `currentImpulseHolder` before accepting the attempt.

---

## Block Window State Machine

The block-attempt loop is driven by the existing impulse window on `GameData`. It has two action sub-states: normal block opportunities, then the final Blocks Declined pre-resolution window.

### Block opportunities

1. Impulse window open (`DIRECTED_SINGLE` or `UNDIRECTED` context, depending on `targetPlayerName`).
2. Current `currentImpulseHolder` may call `AttemptBlock` (naming a ready, unlocked, eligible, non-`cannotBlockRefs` minion) or `PassImpulse`.
3. **If `AttemptBlock`:**
   a. Set `PendingActionState.currentBlockerRef`.
   b. Suspend impulse pass tracking; enter the stealth/intercept exchange sub-window.
   c. Both players pass without further stealth/intercept plays → comparison resolves.
   d. **Block succeeds** (`interceptsByBlockerRef[currentBlockerRef] ≥ stealth`): set `status = BLOCKED`, lock blocker, close the active block-attempt exchange, and open `ACTION_BLOCK_RESOLUTION_PRE_COMBAT` only for explicit card-text hooks. If no effect cancels/replaces block resolution, start combat.
   e. **Block fails** (`stealth > interceptsByBlockerRef[currentBlockerRef]`): blocker does not lock; clear `currentBlockerRef`; return impulse to same holder to try another minion or pass.
4. **If `PassImpulse`:** advance to next player per pass order.
5. All eligible players pass consecutively → enter the Blocks Declined window. Do not call `ResolveAction` yet.

A Methuselah may attempt multiple block attempts with different minions while they hold impulse. If they pass, they may not attempt again in the current window (unless a redirect opens a new window — see below).

### Blocks Declined pre-resolution window

After all eligible Methuselahs have declined block attempts, open/continue an action impulse window with block attempts disabled:

1. Acting Methuselah gets impulse first, then normal action impulse order applies.
2. Legal action modifiers, reactions, and in-play effects may still be played before resolution.
3. Effects with "after blocks are declined" timing are legal in this window. This includes bleed redirects such as Deflection.
4. `AttemptBlock` is rejected while `blocksDeclined = true`.
5. If a card/effect changes `targetPlayerName`, clear the current block-window pass state, set `blocksDeclined = false`, and reopen normal block opportunities for the new target.
6. If all players pass in this window with no target change or action-ending effect, close the impulse window and make `ResolveAction` available.

This window is what allows the common sequence: prey declines to block, acting player increases bleed, prey wakes a locked minion, that minion plays Deflection, then block attempts reopen for the new target with the increased bleed amount preserved.

This is an implementation name for the final before-resolution impulse opportunity described by the official action sequence. It is not a separate action resolution step: once this window closes with no target change or action-ending effect, `ResolveAction` completes the action.

---

## Stealth / Intercept Accumulation

Both totals accumulate on `PendingActionState` and carry across all block windows and redirects. They are never reset while an action is in progress.

### Base values

- Default stealth: defined per action type (see [Actions](./actions.md#basic-action-stealth-defaults)).
- Default intercept: 0 for most minions. Some vampires have printed intercept (stored in card text; not yet parsed — see [Card Keywords](./card-keywords.md)).

### State fields on `PendingActionState`

| Field                        | Type                    | Description                                                                               |
|------------------------------|-------------------------|-------------------------------------------------------------------------------------------|
| `stealth`                    | `int`                   | Action-wide running stealth total                                                         |
| `interceptsByBlockerRef`     | `Map<CardRef, Integer>` | Per-blocker intercept; each blocker has their own accumulator; carries forward on redirect |
| `passedBlockWindowsByPlayer` | `Set<String>`           | Players who have passed in the current block window; reset when a redirect opens a new window |
| `cannotBlockRefs`            | `Set<CardRef>`          | Minions prohibited from blocking for the duration of this action                         |
| `currentBlockerRef`          | `CardRef?`              | Active blocker in a current attempt; null when no attempt in progress                    |
| `blocksDeclined`             | `boolean`               | True after all eligible Methuselahs have declined block attempts and before action resolution; reset on redirect |

### Comparison rule

At the end of each block attempt (after both players pass on modifiers):
```
block succeeds if: interceptsByBlockerRef[currentBlockerRef] >= stealth
```

### "Only when needed" enforcement

Before accepting a stealth or intercept play:
- **Stealth playable** only when `interceptsByBlockerRef[currentBlockerRef] >= stealth` — i.e., the blocker currently has enough intercept to succeed, so more stealth is needed.
- **Intercept playable** only when `stealth > interceptsByBlockerRef[currentBlockerRef]` — i.e., the actor currently has enough stealth to escape, so more intercept is needed.

After each modifier resolves, re-evaluate the condition before allowing another play. A card with text that overrides "only when needed" is accepted regardless of this gate.

---

## Action Redirects

When a reaction card redirects an action to a new target:

1. Update `PendingActionState.targetPlayerName` to the new target.
2. Carry all accumulated modifiers: `stealth`, `interceptsByBlockerRef`, `bleedAmount`.
3. Clear `passedBlockWindowsByPlayer` — players who passed in the previous window may attempt again.
4. Minions in `cannotBlockRefs` remain ineligible for the full action.
5. Set `blocksDeclined = false`.
6. Re-open the block-attempt impulse window with the appropriate context for the new target.

Redirect cards with "after blocks are declined" timing are played in the Blocks Declined pre-resolution window. Redirects are rejected during an active block attempt because the target of the action cannot change while a block attempt is unresolved.

---

## Wake Effects

Wake cards (e.g. On the Qui Vive, Forced Awakening) grant a locked minion temporary permission to play reactions and attempt blocks for the duration of the action.

### State field on `PendingActionState`

`wakePermissionByCardId: Set<String>` — card IDs of locked minions granted wake permission.

### Enforcement

When a wake card is played:
1. Add the minion's card ID to `wakePermissionByCardId`.
2. That minion may now play reactions and attempt blocks as though unlocked.
3. When the action ends (after AFTER_RESOLUTION window closes): clear `wakePermissionByCardId`; apply any lock/unlock or penalty stated in the wake card's text.

### Timing windows

Wake effects are reaction cards, so they can be played during normal reaction-card timing before action resolution when their card text is otherwise legal.

That includes the Blocks Declined pre-resolution window. For example, after a bleed's block attempts have been declined and before `ResolveAction`, a locked minion can play a wake effect, then play a legal bleed-redirect reaction such as Deflection.

Wake effects also have one special timing permission: a locked minion may play a wake effect during the `AS_PLAYED` window when that wake effect is needed to play another reaction/effect that itself is legal in `AS_PLAYED` (for example, an "as it is played" canceller). This is not the `AS_ANNOUNCED` window. Cards playable "as the action is announced" use `AS_ANNOUNCED`; wake effects do not automatically use that window unless their own card text says so.

A reaction card that unlocks a minion but does not grant wake-style "as though unlocked" permission does not get the `AS_PLAYED` exception.

---

## ACTION_CONTINUING

`ActionStatus.ACTION_CONTINUING` is set when a "continue the action" effect fires after blocked combat ends (e.g. Form of Mist). The block-attempt impulse window re-opens:

- All accumulated modifiers (`stealth`, `interceptsByBlockerRef`, `bleedAmount`) are preserved.
- `passedBlockWindowsByPlayer` is cleared — players who passed in the pre-combat window may attempt again.
- `cannotBlockRefs` remains — minions that could not block before still cannot block.

`ACTION_CONTINUING` must be added to the `ActionStatus` Java enum before this path can be wired — see [Actions § ActionStatus Enum](./actions.md#actionstatus-enum). The detection logic (a continue-the-action card play after combat triggers the status change and re-opens the block window) is not yet implemented.

---

## Leave Torpor — Blocked Without Combat

When a `LEAVE_TORPOR` action is blocked, the controller of the blocking minion (the player who controls `blockerRef`) may choose to **diablerize** the torpored vampire instead of entering combat. The decision belongs to the blocking minion's controller regardless of whose impulse it was — this matters in multi-player games where a card grants a third-party minion the right to block. If they decline, the acting vampire stays in torpor and the action fails. This decision is a prompt after `status = BLOCKED` is set — no combat occurs.

---

## Block Eligibility Summary

A minion may attempt to block if **all** of the following hold:

1. Minion is in the READY region (not torpored).
2. Minion is unlocked, **or** the minion is in `wakePermissionByCardId`.
3. Minion's controller is the current `currentImpulseHolder`.
4. For directed actions: minion's controller = `targetPlayerName` (or card text explicitly grants them permission).
5. Minion's card ID is not in `cannotBlockRefs`.
6. Minion is not the acting minion.
7. Minion is not contested (`CardData.contested = false`).
