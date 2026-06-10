# Card Play — Implementation

Documents card play enforcement: phase gating, card type lifecycle, out-of-turn masters, conviction, limited effects, and cancellation in JOL.

See [VTES Rules — Card Timing and Card Types](../rules/card-play.md) for the tabletop rules this implements.

---

## Phase Gate Map

Every card play in rules-enforced mode is validated against this table before the card is accepted.

| CardType               | Required phase | Who may play                                | Source region(s)     |
|------------------------|----------------|---------------------------------------------|----------------------|
| `MASTER` (standard)    | `MASTER`       | Current player only                         | `HAND`               |
| `MASTER` (out-of-turn) | Any except own | Any player when timing condition met        | `HAND`               |
| `EVENT`                | `DISCARD`      | Current player only                         | `HAND`               |
| `CONVICTION`           | `UNLOCK`       | Current player's imbued only                | `HAND` or `ASH_HEAP` |
| `ACTION`               | `MINION`       | Current player only                         | `HAND`               |
| `POWER`                | `MINION`       | Current player's imbued only                | `HAND`               |
| `MODIFIER`             | `MINION`       | Acting player only                          | `HAND`               |
| `REACTION`             | `MINION`       | Any player except acting player             | `HAND`               |
| `COMBAT`               | `MINION` (combat step only) | Attacker or defender only      | `HAND`               |
| `ALLY`                 | `MINION`       | Current player only                         | `HAND`               |
| `RETAINER`             | `MINION`       | Current player only                         | `HAND`               |
| `POLITICAL`            | `MINION`       | Current player only                         | `HAND`               |
| `EQUIPMENT`            | `MINION`       | Current player only                         | `HAND`               |

`PLAYABLE_REGIONS` (the `HAND` and `RESEARCH` set in `RegionType`) handles the normal source check. `CONVICTION` is the only type with an additional legal source (`ASH_HEAP`); the phase gate implementation must check it explicitly.

---

## Card Lifecycle

Every card play in rules-enforced mode moves through four stages.

### Stage 1 — As Played

The playing player declares the card (target, mode, cost). The card **leaves HAND immediately** and enters limbo. A narrow sequencing window opens (`AS_PLAYED`) for "as it is played" cancellers only. Wake effects needed to play effects in that window are also legal here. No cost is paid yet.

### Stage 2 — Limbo

Applies to `ACTION` cards only. While the action is in progress the card remains in HAND but is flagged `CardData.inLimbo = true` (a field to be added). The `GameStateDto` projection filters limbo cards from the HAND card list and exposes them only via `PendingActionState.actionCardRef`. The card cannot be targeted by effects that address HAND cards. All other card types skip limbo — they resolve immediately after the `AS_PLAYED` window closes.

### Stage 3 — Resolution

- **Action cards:** if the action reaches resolution (not blocked), the NRA lock is recorded first, then cost is paid here. If cost cannot be paid, or if the targets are no longer valid, the action **fizzles**: card moves to ASH_HEAP with no effect and no cost paid, but the NRA lock remains because the action reached resolution.
- **All other types:** cost paid immediately at declaration; effect resolves immediately.

### Stage 4 — Destination

After resolution the card goes to its final location:

| Card text                   | Destination                               |
|-----------------------------|-------------------------------------------|
| "Put this card in play"     | Stays in owner's `READY` region           |
| "Put this card on [target]" | Attached to target via `CardAttachedEffect` |
| Neither clause present      | Moved to `ASH_HEAP`                       |

---

## Replacement Timing

After the `AS_PLAYED` window closes (Stage 1 complete), the playing player draws back to their maximum hand size (default 7). If card text says "do not replace until [condition]," hand size stays reduced until that condition is met. Cancellation voids any "do not replace" clause — hand is replaced immediately at the end of the `AS_PLAYED` window.

---

## Cancelled Cards

A cancelled card is treated as though it was played for the purpose of uniqueness limiting, but:
- Hand size is not permanently reduced (draw replacement normally)
- Cost is not paid
- NRA is not triggered
- No other effects propagate

---

## Limited Effect Tracking

Two `(limited)` categories exist, each enforced independently:

**Bleed modifiers (limited):** at most one `(limited)` bleed modifier may increase bleed during a single action.
- Tracked by `bleedLimitedUsed: boolean` on `PendingActionState`.
- Set `true` when the first limited bleed modifier resolves; subsequent plays of limited bleed modifiers are rejected.

**Additional strikes (limited):** at most one `(limited)` additional-strike source per minion per combat round.
- Tracked by `additionalStrikeLimitedUsed_attacker` and `additionalStrikeLimitedUsed_defender` on `CombatState` (per-round fields, reset each new round).

Non-limited bleed modifiers and additional-strike sources stack freely.

---

## Out-of-Turn Masters

Out-of-turn master cards have `CardData.outOfTurn = true` (populated at card build time by checking for "out-of-turn" in card text). Enforcement rules:

- Cannot play during own turn.
- Can play only during another Methuselah's turn when the card's timing condition is satisfied.
- Costs: debits the **playing player's next master phase action**. Track this as `outOfTurnMasterDebtByPlayer: Map<String, Integer>` on `GameData`, incremented by 1 when any out-of-turn master resolves for that player. At MASTER phase entry (`AdvancePhase` → MASTER for that player), set `masterActionsRemaining = max(0, 1 - outOfTurnMasterDebtByPlayer.getOrDefault(player, 0))` then clear that player's debt entry. This means an out-of-turn master consumes the player's next master phase action; two out-of-turn masters between turns leaves them with 0 actions next phase.
- One out-of-turn master per window between turns: `outOfTurnMasterPlayedThisWindowByPlayer: Set<String>` on `GameData` (cleared for that player when their own turn begins). This limit applies even if the player later regains a master phase action. Trifle exception follows the card's text and trifle accounting; do not grant a generic extra master phase action just because the card was played out of turn.

---

## Conviction Cards

`CONVICTION` cards follow a different path from all other card types:

- Legal source regions: `HAND` or `ASH_HEAP`.
- Phase: `UNLOCK`.
- During unlock phase, the current player may play one conviction on each of their imbued from hand or ash heap.
- Imbued entering play with no conviction counter may gain one conviction immediately when `InfluenceCard` resolves (special gain rule, not ordinary card play — does not consume a play action). The controlling player may choose one conviction card from hand, library, or ash heap and attach it. Choosing from the library does not trigger a reshuffle. The gain is optional; declining leaves the imbued with 0 conviction.
- From `HAND`: card replaced normally. From `ASH_HEAP`: card is not replaced (it was already spent).
- Max 5 conviction per imbued; any above 5 are burned.
- "As played" cancellation window exists, but effects cancelling minion cards cannot cancel conviction unless card text explicitly says so.

---

## Dual-Type Cards

`CardData.types` is the authoritative type list. A dual-type card is playable only when at least one of its types matches the current phase/actor gate. The `PlayCard` command includes a `playAsType: CardType?` field. If omitted, the server infers the matching type only when exactly one type in `CardData.types` satisfies the current gate; if multiple types match and `playAsType` is absent, the command is rejected. The selected type determines the resolution path, cost, and phase gate applied.

---

## Missing Enum Values

The following `CardType` enum values must be added before phase enforcement can be implemented:

| Type         | Current state                                              |
|--------------|------------------------------------------------------------|
| `CONVICTION` | Maps to `CardType.NONE` in `GameInitService.toCardType()`  |
| `POWER`      | Maps to `CardType.NONE` in `GameInitService.toCardType()`  |

`CardType.LOCATION` exists in the enum but is unreachable via normal CSV import (location cards arrive typed as `MASTER`). See [Card Keywords](./card-keywords.md) for keyword parsing.

---

## Implementation Scope

`PlayCard` in `CardMovementHandler` needs the following guards added (in order):

1. Source-region check: card must be in `PLAYABLE_REGIONS`, or `ASH_HEAP` for `CONVICTION`.
2. Phase check: card type must match the current phase per the gate table.
3. Actor check: `MODIFIER` requires acting player; `REACTION` requires non-acting player; `COMBAT` requires an active `CombatState`.
4. Card limbo: for `ACTION` type, move card to limbo (`PendingActionState.actionCardRef`) rather than ASH_HEAP immediately.
5. Replacement draw: after `AS_PLAYED` window closes, emit `DrawCard(1)` if hand below max.
6. Limited flag: check and set `bleedLimitedUsed` for `(limited)` bleed modifiers.

`outOfTurn: boolean` must be added to `CardData` and populated in `GameInitService.buildCard()`.

`masterActionsRemaining` is on `GameData` for the current master phase (see [Game State](./game-state.md#phase-accounting-fields)); out-of-turn masters need separate future-debt tracking against the playing player's next master phase.

See [Card Keywords](./card-keywords.md) for keyword parsing required to determine Trifle, out-of-turn, and conviction sub-type routing.
