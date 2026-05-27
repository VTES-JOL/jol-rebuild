# Card Play Rules

Defines when each card type can be played, who may play it, valid source regions, and where cards end up after resolution. These are the rules that `PlayCard` will enforce once phase gating is implemented.

See [vtes-mechanics-gaps.md](vtes-mechanics-gaps.md) for current enforcement status.

See [Rulebook](https://www.vekn.net/rulebook) and [Detailed Play Summary](https://www.vekn.net/detailed-play-summary) for the official reference
The golden rule of VTES is that rules on the card overwrite rules in the rulebook

---

## Impulse Window and Card Play

All card plays occur within an **impulse window**. A player may only play a card when they hold the impulse. The pass order and return-to-current-player-after-resolution rules are defined in [game-state.md § Impulse window](game-state.md#impulse-window-phase-level).

---

## Playing a Card — Step by Step

Based on [Detailed Play Summary §1.6](https://www.vekn.net/detailed-play-summary).

### B — Declaration ("as played" phase)

1. The playing player fully declares all attributes of the card: targets, modes, and cost. The cost must be payable at the time of declaration for the play to be legal.
2. The card leaves the hand immediately — hand size drops by 1.
3. This opens a narrow window for **"as it is played" / "as announced" cancellers only**. No other cards or effects may be played at this step.
4. If the card is cancelled here → see [Cancelled Cards](#cancelled-cards) below.

### C — Replace card

- The card is replaced (the player draws back up to max hand size) **after** all "as played" effects finish resolving.
- If the card text says the card is not replaced until later, the hand size remains reduced until that condition is met.
- Cancellation voids any "do not replace" clause — a cancelled card is replaced normally (via the draw-to-max rule).

### D — Pay costs and resolve

Timing depends on the card category:

| Category                                    | When cost is paid                   | When effect resolves                  | Notes                                                                                                                                         |
|---------------------------------------------|-------------------------------------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| **Action** (card or ability)                | At action resolution — after blocks | After blocks                          | If cost cannot be paid at resolution, or targets are no longer valid → action **fizzles**: pay as much cost as possible, effect has no effect |
| **Strike** (combat)                         | Immediately on play                 | At the appropriate combat timing step | Card is not in play until resolution completes                                                                                                |
| **All others** (modifiers, reactions, etc.) | Immediately                         | Immediately                           | If the card goes "in play," it is in limbo until its condition is met                                                                         |

An action card exists in a limbo state (neither in play nor in the ash heap) from declaration until resolution completes.

---

## Cancelled Cards

A card cancelled "as it is played" (Section B):

- **Is** considered "played" by **card name** for any rule that limits how often a card can be played (e.g. "once per turn", "once per game" — tracked per card name, not UUID).
- **Does not** reduce hand size permanently — the card goes to the ash heap and the draw-to-max rule replaces it at the end of the play attempt.
- **Does not** pay any cost.
- **Does not** trigger the NRA lock (see below) — the same action type may be attempted again this turn.
- No other effects propagate. The play attempt simply ends.

---

## Hand Size and Draw-to-Max

Maximum hand size is **7**. Whenever a player's hand falls below a maximum, they draw back up at the next replacement opportunity. This is what drives all card replacements — after Section C completes, after a cancelled card resolves, etc.

---

## No Repeat Action (NRA) Rule

Source: [Detailed Play Summary §6.1 / Complete Action step](https://www.vekn.net/detailed-play-summary).

The NRA rule limits what a **minion** may do on a given turn. It is tracked **per minion, per turn** — not per player.

### What the NRA locks out

A minion cannot perform the same action again this turn once it **reaches resolution** (blocked or unblocked):

| Action type      | NRA scope                                    |
|------------------|----------------------------------------------|
| Bleed            | Once per minion per turn                     |
| Political action | Once per minion per turn                     |
| Action card      | Same card (by name) once per minion per turn |
| Card in play     | Same card in play once per minion per turn   |

Actions not on this list (hunting, rescue, equip with different equipment, recruit different allies/retainers) may be repeated.

### When the NRA locks in

NRA is triggered at the **Complete Action** step — after block attempts are resolved, before paying cost. Cancellation before resolution does **not** trigger NRA; the minion may attempt the same action again.

### Complete Action sequence (from Detailed Play Summary §D)

1. NRA fires — acting minion is locked out of this action type for the rest of the turn.
2. Then:
   - **Not blocked** → pay cost → resolve action.
   - **Blocked** → action card burned (cost not paid) → blocker locks → combat begins (or diablerize if acting minion is in torpor and blocker is a vampire).

### Two separate tracking mechanisms

| Mechanism                | Triggered                 | Scope                       | Cancelled card counts? |
|--------------------------|---------------------------|-----------------------------|------------------------|
| "As played" by card name | Declaration (Section B)   | Per explicit card-text rule | Yes                    |
| NRA lock                 | Action reaches resolution | Per minion, per turn        | No                     |

---

## Phase Constraints by Card Type

| Card Type                    | Valid Phase                                               | Who can play                            | Source Regions       |
|------------------------------|-----------------------------------------------------------|-----------------------------------------|----------------------|
| `MASTER` (standard)          | `MASTER`                                                  | Current player only                     | HAND                 |
| `MASTER` (out-of-turn)       | Any phase of another player's turn except their `DISCARD` | Any player with impulse                 | HAND                 |
| `EVENT`                      | `DISCARD`                                                 | Current player only                     | HAND                 |
| `CONVICTION`                 | `UNLOCK`                                                  | Current player only                     | HAND **or ASH_HEAP** |
| `POWER` (Imbued)             | `MINION`                                                  | Current player's imbued only            | HAND                 |
| `ACTION`                     | `MINION`                                                  | Current player only                     | HAND                 |
| `MODIFIER` (Action Modifier) | `MINION`                                                  | **Acting player only**                  | HAND                 |
| `REACTION`                   | `MINION`                                                  | Any player **except** the acting player | HAND                 |
| `COMBAT`                     | `MINION` (combat step only)                               | Acting or defending player only         | HAND                 |
| `ALLY`                       | `MINION`                                                  | Current player only                     | HAND                 |
| `RETAINER`                   | `MINION`                                                  | Current player only                     | HAND                 |
| `POLITICAL`                  | `MINION`                                                  | Current player only                     | HAND                 |
| `EQUIPMENT`                  | `MINION`                                                  | Current player only                     | HAND                 |

---

## Special Rules

### Out-of-Turn Masters
A Master card is out-of-turn if its card text contains the string `"out-of-turn"` (case-insensitive). Examples: `Archon Investigation`, `Sudden Reversal`, `Wash`.

- Cannot be played during the owning player's own turn.
- Playable during any phase of another Methuselah's turn **except** their `DISCARD` phase.
- Requires an active impulse window; dispatches `ClaimImpulse` before the effect applies.
- **Cost:** Consumes the playing player's next master phase action — they begin their next `MASTER` phase with zero actions available.
- **Trifle exception:** If the out-of-turn card is also a Trifle, it consumes the trifle use instead of the regular master action (the regular action is preserved; no bonus action is granted).

### Event Cards
- Playing an Event card replaces the current player's discard action for that turn — they do not also draw a replacement card.
- Events stay in play permanently after being played.

### Conviction Cards
- Conviction cards are the only card type playable from ASH_HEAP (in addition to HAND).
- Playing a Conviction card places a conviction counter on a ready Imbued the player controls.

### Action Modifiers vs Reactions
These two types are explicitly asymmetric:
- **Action Modifier** — only the **acting player** may play these. They supplement the action their minion is taking (add stealth, change target, etc.).
- **Reaction** — any player **except** the acting player may play these in response to the declared action.

### Combat Cards
Combat cards can only be played during an active combat (`pendingCombat` state). Both the attacking and the defending players may play them. The combat system is not yet formally implemented; see [vtes-mechanics-gaps.md](vtes-mechanics-gaps.md).

### Imbued Powers (`POWER` type)
Powers are Imbued-specific minion phase cards. Individual powers may further restrict timing via card-text subtypes:
- `[COMBAT]` — playable during combat only (same rules as `COMBAT` type above).
- `[REACTION]` — playable as a reaction (same rules as `REACTION` above).
- Powers with no subtype are played during the minion phase as standard actions.

---

## Dual-Type Cards

The CSV contains cards with slash-separated types (e.g., `Action/Combat`, `Action Modifier/Reaction`, `Combat/Reaction`). A dual-type card is playable whenever **any** of its types would be valid in the current context. `CardData.types` is the authoritative list — `CardData.type` holds only the primary (first) type.

Examples:
- `Action/Reaction` card: playable as an action during `MINION` phase **or** as a reaction by a non-acting player.
- `Combat/Reaction` card: playable during combat **or** as a reaction during the action window.

---

## Card Destination After Play

Where a card ends up after being played is determined by its card text, not its type:

| Card text pattern                                                 | Destination                                   |
|-------------------------------------------------------------------|-----------------------------------------------|
| Contains `"put this card in play"` or `"put this card into play"` | Remains in the acting player's `READY` region |
| Contains `"put this card on [target]"`                            | Attached to the target as a child card        |
| Neither pattern                                                   | Moves to the owner's `ASH_HEAP`               |

This applies to all card types. `CardType.permanentTypes()` is a coarse approximation used for UI hints; card text is the authoritative source.

---

## Implementation Status

Phase enforcement is not yet implemented. `PlayCard` currently accepts any card from `HAND` in any phase. See [vtes-mechanics-gaps.md](vtes-mechanics-gaps.md) §11 for the full gap list and proposed work.

Missing enum values that must be added before enforcement can be implemented:
- `CardType.CONVICTION` — currently maps to `CardType.NONE` in `GameInitService.toCardType()`
- `CardType.POWER` — currently maps to `CardType.NONE` in `GameInitService.toCardType()`
