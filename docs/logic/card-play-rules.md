# Card Play Rules

Defines when each card type can be played, who may play it, valid source regions, and where cards end up after resolution. These are the rules that `PlayCard` will enforce once phase gating is implemented.

See [vtes-mechanics-gaps.md](vtes-mechanics-gaps.md) for current enforcement status.

See [Rulebook](https://www.vekn.net/rulebook) and [Detailed Play Summary](https://www.vekn.net/detailed-play-summary) for the official reference
The golden rule of VTES is that rules on the card overwrite rules in the rulebook

---

## Impulse Window and Card Play

All card plays occur within an **impulse window**. A player may only play a card when they hold the impulse. The pass order and return-to-current-player-after-resolution rules are defined in [game-state.md § Impulse window](game-state.md#impulse-window-phase-level).

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
