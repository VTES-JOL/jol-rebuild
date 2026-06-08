# Card Timing and Card Types

Use this document when deciding whether a card can be played, who may play it, when it is replaced, what happens if it is cancelled, and where it goes after play.

For action execution, see [Actions](./actions.md). For blocking and reaction timing during block attempts, see [Blocking](./blocking.md). For combat cards during combat, see [Combat](./combat.md).

See [Rulebook](https://www.vekn.net/rulebook) and [Detailed Play Summary](https://www.vekn.net/detailed-play-summary) for the official reference. The golden rule of VTES is that rules on the card overwrite rules in the rulebook.

---

## Card Play Procedure

Based on [Detailed Play Summary §1.6](https://www.vekn.net/detailed-play-summary).

### Declaration ("as played" phase)

1. The playing player fully declares all attributes of the card: targets, modes, and cost. The cost must be payable at the time of declaration for the play to be legal.
2. The card leaves the hand immediately, so hand size drops by 1.
3. This opens a narrow window for **"as it is played" / "as announced" cancellers only** (e.g. Direct Intervention). No other cards or effects may be played at this step.
4. If the card is cancelled here, see [Cancelled Cards](#cancelled-cards).

These cancellers form an interrupt layer independent from action state, impulse, and sequencing. They intercept card play at declaration, regardless of which action state is active or who holds priority.

### Replacement

- The card is replaced after all "as played" effects finish resolving.
- If the card text says the card is not replaced until later, the hand size remains reduced until that condition is met.
- Cancellation voids any "do not replace" clause, so a cancelled card is replaced normally.

### Cost and Resolution

Timing depends on the card category:

| Category                                    | When cost is paid                              | When effect resolves                  | Notes                                                                                                                                        |
|---------------------------------------------|------------------------------------------------|---------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| **Action** (card or ability)                | Only if the action is successful (not blocked) | At successful action resolution       | If cost cannot be paid at resolution, or targets are no longer valid, the action fizzles: pay as much cost as possible, effect has no effect |
| **Strike** (combat)                         | Immediately on play                            | At the appropriate combat timing step | Card is not in play until resolution completes                                                                                               |
| **All others** (modifiers, reactions, etc.) | Immediately                                    | Immediately                           | If the card goes "in play," it is in limbo until its condition is met                                                                        |

For action cards and action abilities, the action's cost is not paid when the action is blocked. A blocked action burns the action card, if any, and proceeds to block resolution/combat instead of paying the action cost or applying the action effect.

An action card exists in a limbo state (neither in play nor in the ash heap) from declaration until resolution completes.

---

## Cancelled Cards

A card cancelled "as it is played":

- **Is** considered "played" by **card name** for any rule that limits how often a card can be played.
- **Does not** reduce hand size permanently; the card goes to the ash heap and the draw-to-max rule replaces it.
- **Does not** pay any cost.
- **Does not** trigger the NRA lock; the same action type may be attempted again this turn.
- No other effects propagate. The play attempt simply ends.

---

## Hand Size and Replacement

The default maximum hand size is **7**. Cards and effects can increase or decrease a player's maximum hand size; whenever a player's hand falls below their current maximum, they draw back up at the next replacement opportunity, such as after a card play completes or after a cancelled card resolves.

### Delayed Replacement

Some cards delay the replacement draw. The condition is stated in the card text:

| Card text pattern                                   | Replacement trigger                                     |
|-----------------------------------------------------|---------------------------------------------------------|
| `"Do not replace until after this action."`         | After the current action resolves                       |
| `"Do not replace until after combat."`              | After the current combat ends                           |
| `"Do not replace until after the current turn."`    | At the end of the current player's turn                 |
| `"Do not replace until your next discard phase."`   | At the start of the playing player's next DISCARD phase |
| `"Do not replace until your next unlock phase."`    | At the start of the playing player's next UNLOCK phase  |
| `"Do not replace until [game event]."`              | When the named event occurs                             |
| `"Do not replace as long as this card is in play."` | Never, while the card stays in play                     |

Cancellation voids any "do not replace" clause; a cancelled card is always replaced normally.

---

## Phase Constraints by Card Type

| Card Type                    | Valid Phase                                                   | Who can play                                | Source Regions       |
|------------------------------|---------------------------------------------------------------|---------------------------------------------|----------------------|
| `MASTER` (standard)          | `MASTER`                                                      | Current player only                         | HAND                 |
| `MASTER` (out-of-turn)       | Another player's turn, only when the card text/timing permits | Any eligible player with sequencing/impulse | HAND                 |
| `EVENT`                      | `DISCARD`                                                     | Current player only                         | HAND                 |
| `CONVICTION`                 | `UNLOCK`                                                      | Current player only                         | HAND **or ASH_HEAP** |
| `POWER` (Imbued)             | `MINION`                                                      | Current player's imbued only                | HAND                 |
| `ACTION`                     | `MINION`                                                      | Current player only                         | HAND                 |
| `MODIFIER` (Action Modifier) | `MINION`                                                      | **Acting player only**                      | HAND                 |
| `REACTION`                   | `MINION`                                                      | Any player **except** the acting player     | HAND                 |
| `COMBAT`                     | `MINION` (combat step only)                                   | Acting or defending player only             | HAND                 |
| `ALLY`                       | `MINION`                                                      | Current player only                         | HAND                 |
| `RETAINER`                   | `MINION`                                                      | Current player only                         | HAND                 |
| `POLITICAL`                  | `MINION`                                                      | Current player only                         | HAND                 |
| `EQUIPMENT`                  | `MINION`                                                      | Current player only                         | HAND                 |

Political action cards are played to start a political action during the acting Methuselah's minion phase. Burning a political action card from hand during referendum polling to gain 1 vote is a separate referendum vote-source rule, not a separate card-type phase for playing `POLITICAL` cards.

---

## Card Type Rules

### Out-of-Turn Masters

A Master card is out-of-turn if its card text contains the string `"out-of-turn"` (case-insensitive). Examples: `Archon Investigation`, `Sudden Reversal`, `Wash`.

- Cannot be played during the owning player's own turn.
- Can be played only during another Methuselah's turn and only when the card's own timing condition is satisfied.
- **Cost:** Uses the playing player's next master phase action.
- **Limit:** A Methuselah cannot play more than one out-of-turn master card between two of their turns, even if they later regain a master phase action.
- **Trifle exception:** If the out-of-turn card is also a Trifle, apply the card's own text and the master-action accounting rules for trifles; do not grant a generic extra master phase action just because the card was played out of turn.

### Event Cards

- Playing an Event card uses the current player's discard phase action for that turn.
- A Methuselah receives one discard phase action by default. Effects can grant additional discard phase actions or alternate ways to spend them.
- No more than one Event card may be played in a single discard phase, even if the Methuselah has additional discard phase actions.
- Event cards follow the normal replacement rule: the card is replaced when played unless the event's own text says not to replace it, or says to replace it later.
- Events stay in play permanently after being played unless card text removes them.

### Conviction Cards

- Conviction is an unlock-phase card type, not a master, minion, or discard/event card.
- During their unlock phase, a Methuselah may play 1 conviction on each of their imbued. These unlock-phase conviction plays may come from hand or ash heap.
- Because unlock-phase conviction attachment is a card play, it has the normal "as played" cancellation window. However, conviction is not a minion card, so effects that cancel a minion card as it is played (e.g. `Direct Intervention`) cannot cancel a conviction unless the cancelling effect's own text also applies to conviction or to that broader card type.
- A conviction played from hand follows the normal replacement rule. A conviction played from the ash heap is not replaced, because no card left the player's hand.
- When an imbued enters play with no conviction, that imbued may gain 1 conviction from its controller's library, hand, or ash heap. This is a special gain/attach rule, not ordinary card play from the library.
- Each imbued can have at most 5 conviction. Any conviction gained above 5 is burned instead.

### Action Modifiers vs Reactions

These two types are explicitly asymmetric:

- **Action Modifier** - only the **acting player** may play these. They supplement the action their minion is taking, such as adding stealth or changing a target.
- **Reaction** - any player **except** the acting player may play these in response to the declared action.

### Combat Cards

Combat cards can only be played during an active combat. Both the attacking and the defending players may play them. See [Combat](./combat.md) for the full combat rules.

### Imbued Powers (`POWER` type)

Powers are Imbued-specific minion phase cards. Individual powers may further restrict timing via card-text subtypes:

- `[COMBAT]` - playable during combat only, using the same rules as `COMBAT` cards.
- `[REACTION]` - playable as a reaction, using the same rules as `REACTION` cards.
- Powers with no subtype are played during the minion phase as standard actions.

---

## Dual-Type Cards

The CSV contains cards with slash-separated types (e.g., `Action/Combat`, `Action Modifier/Reaction`, `Combat/Reaction`). `CardData.types` is the authoritative list; `CardData.type` holds only the primary (first) type.

A dual-type card is playable only for an ability or effect whose own type/timing is valid in the current context. The card's other printed abilities or effects are not available just because a different type on the same card is currently legal.

Examples:

- `Action/Reaction` card: the action text is usable only when the card is being played as an action during the acting Methuselah's minion phase; the reaction text is usable only when the card is being played as a reaction by a non-acting Methuselah.
- `Combat/Reaction` card: the combat text is usable only during combat; the reaction text is usable only during a reaction window.

---

## Limited Effects

Some cumulative effects are forbidden. A card is "limited" if it cannot stack with another card or effect of the same limited type. The card text marks this with `"(limited)"`.

Two specific limited categories exist:

| Category                         | Rule                                                                                                                                                                                                                                   |
|----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Bleed increase (limited)**     | During a bleed action, at most one action modifier may increase the bleed amount via a "limited" source. A second "(limited)" bleed modifier cannot be played if the bleed is already being increased by another "(limited)" modifier. |
| **Additional strikes (limited)** | A minion cannot gain additional strikes per round from more than one "(limited)" source.                                                                                                                                               |

A card that does **not** include `"(limited)"` in its text does not count against these limits.

---

## Card Destination After Play

Where a card ends up after being played is determined by its card text, not its type:

| Card text pattern                                                 | Destination                                   |
|-------------------------------------------------------------------|-----------------------------------------------|
| Contains `"put this card in play"` or `"put this card into play"` | Remains in the acting player's `READY` region |
| Contains `"put this card on [target]"`                            | Attached to the target as a child card        |
| Neither pattern                                                   | Moves to the owner's `ASH_HEAP`               |
