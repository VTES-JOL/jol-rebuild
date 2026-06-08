# Card Play Rules

Defines when each card type can be played, who may play it, and how actions, blocking, and card effects resolve.

See [JOL Implementation — Card Play](../implementation/card-play.md) for current enforcement status.

See [Rulebook](https://www.vekn.net/rulebook) and [Detailed Play Summary](https://www.vekn.net/detailed-play-summary) for the official reference.
The golden rule of VTES is that rules on the card overwrite rules in the rulebook.

---

## Minion Readiness

A **ready minion** is a minion in the ready region. Most minion activity also requires the minion to be unlocked and uncontested:

- **Ready region** — vampires in torpor are not ready; allies reduced to 0 life are burned.
- **Unlocked** — a locked minion normally cannot take actions, attempt blocks, or play reaction cards.
- **Not contested** — a contested unique card is out of play until the contest resolves; a contested title means the vampire is treated as having no title while the contest lasts.
- **Not burned** — the card is still in play.

Ready, unlocked minions may take actions, attempt blocks, and play reaction cards. Exceptions are card-text driven: wake effects can let locked minions react/block for an action, and a vampire in torpor may take the special Leave Torpor action.

---

## Action Lifecycle State Machine

Every action follows this state sequence:

```
Idle → As Announced → During Action (Impulse Loop) → Resolution → After Resolution → End
```

For blocked actions that are continued (e.g. Form of Mist), the sequence expands:

```
... → Resolution → Action Continuing → Block Attempts → Resolution → After Resolution → End
```

| State                 | Impulse? | Priority system              | Notes                                                                              |
|-----------------------|----------|------------------------------|------------------------------------------------------------------------------------|
| **As Played**         | No       | Sequencing (ABC)             | Restricted window; only "as played" cancellers legal, no redraw                    |
| **During Action**     | Yes      | Impulse (resets on any play) | Stealth/intercept subject to "only when needed" rule; see Blocking                 |
| **Resolution**        | No       | Deterministic                | No player interaction; two branches (see below)                                    |
| **Action Continuing** | No       | Sequencing (ABC)             | Fires when a "continue the action" effect (e.g. Form of Mist) is played; see below |
| **After Resolution**  | No       | Sequencing (ABC)             | One effect at a time; Freak Drive, Voter Captivation, etc.                         |

**ABC sequencing rule:** When multiple players may act simultaneously, priority goes: **A**cting/active player first → **B**locking/defending player → others **C**lockwise from the acting player. The window resets to A after each play.

**Resolution branches:**
- Action not blocked → pay cost → apply effect → enter After Resolution
- Action blocked → combat subsystem (FIFO queue) → when combat fully resolves → enter After Resolution (or Action Continuing if a continue-the-action effect fires)

Combat must fully resolve before the lifecycle leaves Resolution.

### Action Continuing state

When a "continue the action" effect fires after a blocked combat (e.g. Form of Mist), the game enters **Action Continuing** before returning to Block Attempts:

- "After combat ends" and "after block resolution" effects triggered by the **preceding** block are playable in this window, alongside the continue-the-action effect — no mandatory ordering between them.
- The game remembers the action was already blocked. Cards that trigger on block resolution (e.g. Cats' Guidance) remain valid after continuation, because the prior block already occurred.
- Returning to Block Attempts does **not** re-open the As Announced or During Action windows from scratch — it resumes only at the block-attempt step.
- If the continued action is blocked again, combat resolves again and another Action Continuing window may open.

---

## Impulse Window and Card Play

Card and effect plays occur within timing windows governed by impulse or sequencing. A player may only play a card when they hold the relevant impulse or sequencing priority. The pass order and return-to-acting-player-after-play rules are defined in [Game Flow § Impulse and Sequencing](./game-flow.md#impulse-and-sequencing).

---

## Action Success and Failure

An action has multiple layers of success that card effects may reference independently.

### Action-level success

An action is **successful** if it reaches the resolution phase — i.e. it was not blocked. A blocked action is **unsuccessful** at the action level, regardless of any other outcome.

### Bleed action and Edge movement

A bleed action is successful if the action is not blocked. Edge movement uses a separate rule: the acting Methuselah takes the Edge only when the bleed burns 1 or more pool.

Card text that refers to a "successful bleed" should be interpreted according to the current VEKN wording/rulings for that card. Do not use Edge movement as the generic definition of bleed-action success.

### Referendum success

A referendum is **successful** if it passes — that is, more votes are cast for it than against it. A failed referendum is not a successful referendum even if the political action itself was successful (reached the referendum step unblocked).

### Combining definitions

These three layers are orthogonal:

| Scenario                                                 | Action successful? | Bleed successful?      | Referendum successful? |
|----------------------------------------------------------|--------------------|------------------------|------------------------|
| Bleed for 3 reaches resolution, prey loses 3 pool        | Yes                | Yes; Edge moves        | —                      |
| Bleed for 3 reaches resolution, reduced to 0 by reaction | Yes                | No; Edge does not move | —                      |
| Bleed blocked                                            | No                 | No                     | —                      |
| Political action reaches referendum, referendum passes   | Yes                | —                      | Yes                    |
| Political action reaches referendum, referendum fails    | Yes                | —                      | No                     |
| Political action blocked                                 | No                 | —                      | No                     |

Card effects that say "after a successful action" trigger on any action-level success. Effects that say "after a successful bleed" or "after a successful referendum" use their specific card-text/rules context.

---

## Basic Minion Actions

Any minion may perform these actions without an action card. All actions except bleed default to +1 stealth.

| Action               | Who           | Default stealth | Effect                                                                                                                                                                                                                                                                                                  |
|----------------------|---------------|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Bleed**            | Any minion    | +0              | Target prey burns pool equal to bleed amount (vampires and imbued default 1, otherwise by card text). Acting player gains (or keeps) the Edge if they bleed for 1+ pool.                                                                                                                                |
| **Hunt**             | Vampires only | +1              | Vampire gains 1 blood from the bank up to their capacity. Any blood gained beyond capacity is burned (returned to the bank).                                                                                                                                                                            |
| **Equip**            | Any minion    | +1              | Move an equipment card from hand or from another minion the player controls onto this minion.                                                                                                                                                                                                           |
| **Employ Retainer**  | Any minion    | +1              | Place a retainer card from hand onto this minion with life counters as specified.                                                                                                                                                                                                                       |
| **Recruit Ally**     | Any minion    | +1              | Place an ally card from hand into the uncontrolled region with life counters as specified to indicate that it cannot act this turn. During the acting Methuselah's discard phase, new allies move to the ready region. Recruited allies are public cards, unlike face-down uncontrolled crypt cards.    |
| **Political Action** | Vampires only | +1              | Requires a political action card or an option from a card in play. Initiates a referendum; see [Referendum](#referendum).                                                                                                                                                                               |

Basic actions other than bleed are repeatable by the same minion in a turn (NRA does not apply to hunt, equip with different equipment, or recruit different allies/retainers).

### Blood capacity overflow

A vampire's blood total can never exceed their current capacity. Any effect that would bring a vampire above capacity instead brings them to capacity — the excess blood is returned to the bank. This applies to hunt, blood gain from card effects, and any other source of blood.

---

## Blocking

### Directed vs undirected actions

Every action is either directed (targets one or more Methuselahs or things they control) or undirected (no opposing Methuselah target).

| Action type    | Who may attempt to block                                                                                                                                                                                      |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Directed**   | Only the targeted Methuselah(s), or the Methuselah(s) who control the targeted thing(s), may attempt to block with ready, unlocked minions, unless card text explicitly allows another Methuselah to attempt. |
| **Undirected** | Prey first, then predator; no other Methuselahs may attempt unless card text explicitly allows it.                                                                                                            |

**Determining action direction:**

- **Bleed** is directed toward the prey by default. A small number of card effects can choose or redirect a bleed to a different Methuselah; the card text specifies the new target.
- **Other actions** — the card text determines direction. If the card text names one or more specific players, player-controlled cards, or player-controlled minions as targets, the action is directed toward those players. The blocking players are the targeted Methuselahs and/or the controllers of the targeted cards or minions.
- If the card text does not specify a particular Methuselah or their cards as a target, the action is undirected.

For a directed action with more than one eligible blocking Methuselah, block opportunities are offered in clockwise order from the acting Methuselah. Each targeted Methuselah may make block attempts only while their current block opportunity remains open; once they decline further attempts for that window, the opportunity passes to the next eligible targeted Methuselah.

Once a Methuselah decides not to make any further block attempts against a given action **within the current block window**, that decision is final — they cannot re-enter that block window. See [Action redirects](#action-redirects) below for what happens when the action is redirected to a new target.

### Block attempt protocol

1. A Methuselah declares one eligible minion as the blocker. This is normally a ready, unlocked minion; wake-style effects can allow a locked minion to attempt to block as though unlocked.
2. Stealth and intercept modifiers may be played (subject to the "only when needed" rule below).
3. If the blocker's final intercept ≥ the acting minion's final stealth → the action is **blocked**; as part of block resolution, the blocker is locked and enters combat with the acting minion. This does not require the blocker to have been unlocked before the attempt; a locked minion blocking via a wake-style effect remains locked.
4. If stealth exceeds intercept → the block attempt fails; the blocker does **not** lock; next eligible Methuselah may attempt.
5. If all eligible Methuselahs pass without a successful block → the action succeeds and enters Resolution.

A single Methuselah may make multiple successive attempts with different minions while that Methuselah's block opportunity remains open.

### Modifier persistence

All action modifiers and reactions that affect the action accumulate over the **entire action lifecycle** and are never reset while the action is in progress. This includes:

- **Stealth** — the acting minion's stealth total carries forward through all block windows, including after a redirect.
- **Intercept** — a minion's intercept total carries forward, even if the action was redirected away from their controller and then back.
- **Bleed amount** — increases and decreases applied by modifiers and reactions persist.
- **Other modifiers** — any other action modifier or reaction already played remains in effect regardless of redirects or additional block windows.

The "only when needed" rule applies to each new block attempt based on the **current accumulated totals**, not the starting values.

### Action redirects

Some reaction cards allow a Methuselah to redirect an action to a different target. When a redirect occurs:

- All accumulated modifiers (stealth, intercept, bleed amount, etc.) **carry over** — nothing resets.
- A new block window opens with the **new target** Methuselah.
- Any Methuselah who passed on blocking during a **previous** block window for this action is **not** automatically excluded from the new window. If the action is redirected back to a player who previously passed, all of that player's eligible minions may attempt to block again — the prior pass applies only to the window in which it was made.
- The exception is any minion that carries an explicit "cannot attempt to block" restriction from a card effect — that restriction persists for the duration of the action.

**Example sequence (bleed redirected away and back):**

1. Player 1 declares a directed bleed at Player 2 with 1 stealth.
2. Minion A (Player 2) wakes and declines to block — no longer eligible in this block window.
3. Minion B (Player 2) attempts to block with 1 intercept; Player 1 plays +1 stealth (now 2 stealth); Player 2 passes — block window closes, action proceeds.
4. Player 2 plays a reaction redirecting the bleed to Player 3. Accumulated stealth is 2.
5. Player 3 declines to block; plays a reaction redirecting the bleed back to Player 2.
6. A new block window opens for Player 2. **Both Minion A and Minion B are eligible again.** Minion B still has 1 intercept (retained); the acting minion still has 2 stealth.
7. Modifiers (including additional bleed increases, subject to the limited rule) may still be played during this new block window.

### Stealth and intercept — "only when needed"

Stealth and intercept can only be added **when they are needed** — the current totals must make the play or effect necessary:

- **Stealth** (action modifier or effect) — may only be played or used when a block attempt is active **and** the blocker's current intercept ≥ the actor's current stealth (i.e. the block would currently succeed).
- **Intercept** (reaction or effect) — may only be played or used during a block attempt **and** the actor's current stealth > the blocker's current intercept (i.e. the block would currently fail).

This rule is a timing gate, not a cap on the amount granted by a legal single effect. If one legal card or effect grants more stealth or intercept than the minimum needed, the full amount is applied. For example, `Forgotten Labyrinth` can raise a default +1 stealth political action to +3 stealth at basic Obfuscate or +4 stealth at superior Obfuscate when stealth is needed, because the extra stealth is produced by one effect.

After each stealth or intercept effect resolves, recalculate the current totals before allowing another stealth or intercept effect:

- If the blocking minion's current intercept is still ≥ the acting minion's current stealth, the block would still succeed, so the acting minion may play or use another otherwise-legal stealth effect.
- If the acting minion's current stealth is still > the blocking minion's current intercept, the block attempt would still fail, so the blocking minion may play or use another otherwise-legal intercept effect.

Example: if the blocker has 3 intercept and the acting minion has 1 stealth, the acting minion may play a +1 stealth effect, moving to 2 stealth. Because 3 intercept would still block 2 stealth, stealth is still needed and another otherwise-legal stealth effect may be played. Once the acting minion's stealth exceeds the blocker's intercept, no more stealth is needed for that block attempt unless the blocker adds more intercept.

Card text can explicitly override the timing gate. If a card says it can be played or used even when stealth or intercept is not yet needed, that text takes precedence over the default rulebook restriction. Rule enforcement should therefore support card-defined exceptions rather than treating the "only when needed" gate as an absolute global invariant.

Default stealth and intercept are both 0, unless the action has an inherent stealth bonus (see Basic Minion Actions above).

---

## Playing a Card — Step by Step

Based on [Detailed Play Summary §1.6](https://www.vekn.net/detailed-play-summary).

### B — Declaration ("as played" phase)

1. The playing player fully declares all attributes of the card: targets, modes, and cost. The cost must be payable at the time of declaration for the play to be legal.
2. The card leaves the hand immediately — hand size drops by 1.
3. This opens a narrow window for **"as it is played" / "as announced" cancellers only** (e.g. Direct Intervention). No other cards or effects may be played at this step.
4. If the card is cancelled here → see [Cancelled Cards](#cancelled-cards) below.

> **Interrupt Layer note:** These cancellers form an independent interrupt layer that is orthogonal to the action state machine and to impulse/sequencing. They intercept card play at the moment of declaration, regardless of which action state is active or who holds priority.

### C — Replace card

- The card is replaced (the player draws back up to max hand size) **after** all "as played" effects finish resolving.
- If the card text says the card is not replaced until later, the hand size remains reduced until that condition is met.
- Cancellation voids any "do not replace" clause — a cancelled card is replaced normally.

### D — Pay costs and resolve

Timing depends on the card category:

| Category                                    | When cost is paid                                 | When effect resolves                  | Notes                                                                                                                                         |
|---------------------------------------------|---------------------------------------------------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| **Action** (card or ability)                | Only if the action is successful (not blocked)    | At successful action resolution       | If cost cannot be paid at resolution, or targets are no longer valid → action **fizzles**: pay as much cost as possible, effect has no effect |
| **Strike** (combat)                         | Immediately on play                               | At the appropriate combat timing step | Card is not in play until resolution completes                                                                                                |
| **All others** (modifiers, reactions, etc.) | Immediately                                       | Immediately                           | If the card goes "in play," it is in limbo until its condition is met                                                                         |

For action cards and action abilities, the action's cost is not paid when the action is blocked. A blocked action burns the action card, if any, and proceeds to block resolution/combat instead of paying the action cost or applying the action effect.

An action card exists in a limbo state (neither in play nor in the ash heap) from declaration until resolution completes.

---

## Cancelled Cards

A card cancelled "as it is played" (Section B):

- **Is** considered "played" by **card name** for any rule that limits how often a card can be played.
- **Does not** reduce hand size permanently — the card goes to the ash heap and the draw-to-max rule replaces it.
- **Does not** pay any cost.
- **Does not** trigger the NRA lock — the same action type may be attempted again this turn.
- No other effects propagate. The play attempt simply ends.

---

## Hand Size and Draw-to-Max

The default maximum hand size is **7**. Cards and effects can increase or decrease a player's maximum hand size; whenever a player's hand falls below their current maximum, they draw back up at the next replacement opportunity — after Section C completes, after a cancelled card resolves, etc.

### "Do Not Replace" Conditions

Some cards delay the replacement draw. The condition is stated in the card text:

| Card text pattern                                   | Replacement trigger                                     |
|-----------------------------------------------------|---------------------------------------------------------|
| `"Do not replace until after this action."`         | After the current action resolves                       |
| `"Do not replace until after combat."`              | After the current combat ends                           |
| `"Do not replace until after the current turn."`    | At the end of the current player's turn                 |
| `"Do not replace until your next discard phase."`   | At the start of the playing player's next DISCARD phase |
| `"Do not replace until your next unlock phase."`    | At the start of the playing player's next UNLOCK phase  |
| `"Do not replace until [game event]."`              | When the named event occurs                             |
| `"Do not replace as long as this card is in play."` | Never (card stays unreplaced while in play)             |

Cancellation voids any "do not replace" clause — a cancelled card is always replaced normally.

---

## No Repeat Action (NRA) Rule

Source: [Detailed Play Summary §6.1 / Complete Action step](https://www.vekn.net/detailed-play-summary).

The NRA rule limits what a **minion** may do on a given turn. It is tracked **per minion, per turn** — not per player.

### What the NRA locks out

A minion cannot perform the same NRA-scoped action again this turn once it **reaches resolution** (blocked or unblocked):

| Action source             | NRA scope                                                                                                    |
|---------------------------|--------------------------------------------------------------------------------------------------------------|
| Basic bleed               | Once per minion per turn                                                                                     |
| Political action          | Once per vampire per turn                                                                                    |
| Action card from hand     | Same named action card once per minion per turn, unless the play is cancelled                                |
| Action via a card in play | Same action provided by the same in-play copy once per minion per turn, including the minion's own card text |

Actions not on this list (hunting, rescue, equip with different equipment, recruit different allies/retainers) may be repeated.

For NRA, **card in play** means a specific action ability on an in-play card or minion text that provides an action the minion can perform. It does not mean every effect printed on a card in the ready region is automatically limited to once per turn. Non-action effects, activated effects, and continuous effects follow their own card text, costs, timing windows, and any explicit "once each turn" limits.

The NRA lock **persists through mid-turn unlocks**. If a vampire unlocks during the turn (via Freak Drive, As the Crow, or any other effect) and takes another action, it still cannot use the same named action card or same in-play action ability it already resolved earlier that turn.

### When the NRA locks in

NRA is triggered at the **Complete Action** step — after block attempts are resolved, before paying cost. Cancellation before resolution does **not** trigger NRA; the minion may attempt the same action again.

### Complete Action sequence (from Detailed Play Summary §D)

1. NRA fires — acting minion is locked out of this action type for the rest of the turn.
2. Then:
   - **Not blocked** → pay cost → resolve action.
   - **Blocked** → action card burned (cost not paid) → blocker locks → combat begins (exception: if the acting minion is in torpor, there is no combat — the blocking player may choose to diablerize instead; see Leave Torpor in [Combat](./combat.md)).

### Two separate tracking mechanisms

| Mechanism                | Triggered                 | Scope                       | Cancelled card counts? |
|--------------------------|---------------------------|-----------------------------|------------------------|
| "As played" by card name | Declaration (Section B)   | Per explicit card-text rule | Yes                    |
| NRA lock                 | Action reaches resolution | Per minion, per turn        | No                     |

---

## Limited Effects

Source: VEKN Rulebook — Bleed and Additional Strikes.

Some cumulative effects are forbidden. A card is "limited" if it cannot stack with another card or effect of the same limited type. The card text marks this with `"(limited)"`.

Two specific limited categories exist:

| Category                         | Rule                                                                                                                                                                                                                                   |
|----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Bleed increase (limited)**     | During a bleed action, at most one action modifier may increase the bleed amount via a "limited" source. A second "(limited)" bleed modifier cannot be played if the bleed is already being increased by another "(limited)" modifier. |
| **Additional strikes (limited)** | A minion cannot gain additional strikes per round from more than one "(limited)" source.                                                                                                                                               |

A card that does **not** include `"(limited)"` in its text does not count against these limits.

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

## Special Rules

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

### Locked Minion Reaction Exception

The default rule is that only **ready, unlocked** minions may play reaction cards. Some reaction cards explicitly override this with the text `"Usable by a locked minion."` When that text is present, the locked minion may play the reaction despite being locked. No other reaction card may be played by a locked minion.

### Wake Effects

A **wake effect** is a special reaction card (e.g. On the Qui Vive, Forced Awakening) that allows a locked minion to react during another Methuselah's action as though unlocked:

- Wake cards are played in the "as played" interrupt layer, allowing them to be played by a locked minion as soon as an eligible action is declared.
- A wake effect does not unlock the minion or change its ready/locked state. It grants permission for the minion to play further reaction cards and attempt to block as though unlocked for the duration specified by the card.
- If the minion blocks and combat results, they remain engaged in combat normally.
- At the end of the action, the permission expires. Any additional lock/unlock or penalty text on the wake card is then applied as specified.

### Action Modifiers vs Reactions

These two types are explicitly asymmetric:
- **Action Modifier** — only the **acting player** may play these. They supplement the action their minion is taking (add stealth, change target, etc.).
- **Reaction** — any player **except** the acting player may play these in response to the declared action.

### Combat Cards

Combat cards can only be played during an active combat. Both the attacking and the defending players may play them. See [Combat](./combat.md) for the full combat rules.

### Imbued Powers (`POWER` type)

Powers are Imbued-specific minion phase cards. Individual powers may further restrict timing via card-text subtypes:
- `[COMBAT]` — playable during combat only (same rules as `COMBAT` type above).
- `[REACTION]` — playable as a reaction (same rules as `REACTION` above).
- Powers with no subtype are played during the minion phase as standard actions.

---

## Dual-Type Cards

The CSV contains cards with slash-separated types (e.g., `Action/Combat`, `Action Modifier/Reaction`, `Combat/Reaction`). `CardData.types` is the authoritative list — `CardData.type` holds only the primary (first) type.

A dual-type card is playable only for an ability or effect whose own type/timing is valid in the current context. The card's other printed abilities or effects are not available just because a different type on the same card is currently legal.

Examples:
- `Action/Reaction` card: the action text is usable only when the card is being played as an action during the acting Methuselah's minion phase; the reaction text is usable only when the card is being played as a reaction by a non-acting Methuselah.
- `Combat/Reaction` card: the combat text is usable only during combat; the reaction text is usable only during a reaction window.

---

## Card Destination After Play

Where a card ends up after being played is determined by its card text, not its type:

| Card text pattern                                                 | Destination                                   |
|-------------------------------------------------------------------|-----------------------------------------------|
| Contains `"put this card in play"` or `"put this card into play"` | Remains in the acting player's `READY` region |
| Contains `"put this card on [target]"`                            | Attached to the target as a child card        |
| Neither pattern                                                   | Moves to the owner's `ASH_HEAP`               |

---

## After Resolution

After an action fully resolves (or is blocked and combat ends), the game enters the **After Resolution** state before the action lifecycle closes.

- Uses **sequencing (ABC priority)**, not impulse — the impulse loop has already ended.
- One card or effect resolves at a time; this is not an open loop.
- Only "after successful action" or "after resolution" effects are legal here.

### All "after \[X\] resolution" phrases map to this window

The following card-text phrases are all equivalent and refer to the same After Resolution window:
- "after action resolution" / "after this action"
- "after bleed resolution"
- "after referendum resolution"
- "after block resolution" (valid only when a block occurred)

A player may freely choose the order in which their eligible After Resolution effects resolve. Order matters only when one effect would cancel or invalidate another.

"After combat ends" effects are handled by the combat subsystem when combat ends. If such an effect continues the action after a block, the action enters **Action Continuing** before returning to block attempts.

### Triggered abilities check their preconditions at trigger time

An "after resolution" triggered ability verifies its preconditions **at the moment it would fire**, not at the moment the action resolved. If the triggering condition is no longer true when the After Resolution window opens, the ability does not trigger.

### Typical effects that fire in this window

| Card / Effect               | Trigger condition                                                |
|-----------------------------|------------------------------------------------------------------|
| Freak Drive                 | After the acting minion's action resolves (success or block)     |
| Voter Captivation           | After a successful political action                              |
| Cats' Guidance              | After block resolution (remains valid after action continuation) |
| Lutz von Hohenzollern       | After a successful referendum (checks readiness at trigger time) |
| "After this action" effects | Any card text specifying this window                             |

No further block attempts, stealth/intercept plays, or action modifiers are legal here — those windows have closed.

---

## Referendum

A referendum is initiated by a successful political action. It proceeds through three mandatory steps.

### Step 1 — Choose Terms

The terms are chosen by the acting vampire's controller **after** the action is confirmed unblocked. If the political action card offers choices (e.g. which player to affect), those choices are made here.

### Step 2 — Polling

1. **"Before votes and ballots are cast" effects** — a distinct sub-window fires first, following ABC sequencing.
2. **Votes and ballots are cast** — any Methuselah may cast their available votes/ballots in any order. There is no obligation to vote. Votes are irreversible once cast.
3. Cards marked **"only usable during a political action"** are legal only during this polling step.

### Step 3 — Resolution

- More votes **for** than **against** → referendum passes; effects take place.
- Tied or more votes **against** → referendum fails; no effect.

### Vote sources

| Source                      | Votes                                                                                                                                                                                                                                             |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Political action card       | The card that called the referendum gives 1 vote to the acting vampire's controller. Other Methuselahs may burn one political action card from hand for 1 vote; each Methuselah can use only one political action card for votes in a referendum. |
| Primogen / Bishop           | 1 per ready vampire                                                                                                                                                                                                                               |
| Prince / Baron / Archbishop | 2 per ready vampire                                                                                                                                                                                                                               |
| Justicar / Cardinal         | 3 per ready vampire                                                                                                                                                                                                                               |
| Inner Circle / Regent       | 4 per ready vampire                                                                                                                                                                                                                               |
| The Edge                    | 1 (burn the Edge to gain it)                                                                                                                                                                                                                      |
| Card effects                | As specified                                                                                                                                                                                                                                      |

Torpored vampires cannot cast votes.

### Prisci block

Priscus is a collective Sabbat title. A ready Priscus provides **one ballot**, not ordinary votes. The Prisci block provides three votes in the main referendum, decided by a Prisci-only sub-referendum.

1. During polling, each ready Priscus may cast one ballot in the Prisci sub-referendum.
2. Only Prisci ballots participate in this sub-referendum.
3. The Prisci block contributes three votes to the main referendum according to the current result of the Prisci ballots.
4. As more Prisci cast ballots, the block may shift between for, against, or no contribution if the ballots are tied.

The Prisci block is resolved as part of polling before the main referendum outcome is finalized.

### Blood hunt referendum

A blood hunt referendum is automatically called after any diablerie occurs. It differs from a political action referendum:

- It is **not** initiated by a political action card — no card is played.
- The **acting Methuselah** for impulse and sequencing is the Methuselah whose vampire was diablerized (the victim's controller).
- The terms are fixed: the referendum targets the diablerist. If it passes, the diablerist is burned.
- The blood hunt referendum follows the same three-step structure and the same vote sources as any other referendum, except that it is not an action: it cannot be blocked, and action modifiers and reaction cards cannot be played.
- Legal vote sources include votes and ballots from ready titled vampires, the Edge, one political action card burned from hand per Methuselah, and in-play card effects that are usable during the current referendum.
- Do not allow vote modifiers from hand unless the card text explicitly says it is usable during a blood hunt referendum or otherwise overrides the normal blood hunt restriction. Effects restricted to "a political action" or "the polling step of a political action" are not usable during a blood hunt.
- Trophy awards (for Red List minions, if applicable) are resolved **before** the blood hunt referendum is called. See the Red List trait in [Mechanics Gaps § Minion Traits](../implementation/mechanics-gaps.md#14-minion-traits).

### The Edge

The Edge is a game token that passes between players during bleed actions:
- The acting player takes the Edge whenever their bleed action resolves for 1 or more pool damage.
- During referendum polling the Edge-holder may burn the Edge to gain 1 vote.
- Only one player holds the Edge at a time; it starts the game with no owner.

---

## Combat

Combat occurs when a block attempt succeeds (or a rush action resolves). Full combat mechanics — round sequence, range, strike types, damage, torpor, Leave Torpor, and diablerie — are documented in [Combat](./combat.md).

**Summary relevant to card play timing:**
- The acting minion has first priority (ABC: A) at every combat step.
- Steps 1 (Before Range), 2 (Determine Range), and 3 (Before Strikes) are distinct timing windows. Step 3 closes only after both combatants decline to play legal "before strikes are chosen" effects, though a UI may auto-skip it when neither combatant has any legal effect.
- Step 3 is after range is determined and before the initial strikes are chosen for that round. Additional strikes repeat strike announcement and strike resolution only; they do not reopen the Before Strikes window unless card text explicitly says otherwise.
- Default at end of each round: combat ends. A press-to-continue card forces another round; a press-to-end cancels it.
- Combat must fully resolve before the action lifecycle leaves the Resolution state and enters After Resolution.
