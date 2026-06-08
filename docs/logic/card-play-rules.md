# Card Play Rules

Defines when each card type can be played, who may play it, valid source regions, and where cards end up after resolution. These are the rules that `PlayCard` will enforce once phase gating is implemented.

See [vtes-mechanics-gaps.md](vtes-mechanics-gaps.md) for current enforcement status.

See [Rulebook](https://www.vekn.net/rulebook) and [Detailed Play Summary](https://www.vekn.net/detailed-play-summary) for the official reference
The golden rule of VTES is that rules on the card overwrite rules in the rulebook

---

## Minion Readiness

A minion must be **ready** to take an action or attempt to block. Ready means all four conditions are true:

- **Unlocked** — not locked (tapped).
- **Not in torpor** — vampires sent to torpor are not ready; allies reduced to 0 life are burned.
- **Not burned** — the card is still in play.
- **Not contested** — if the card is a unique card or titled vampire whose title is currently contested, it is not ready until the contest resolves.

Only ready minions may declare actions, attempt blocks, or play reaction cards (with the wake-effect exception documented in Special Rules).

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

| State | Impulse? | Priority system | Notes |
|---|---|---|---|
| **As Announced** | No | Sequencing (ABC) | Restricted window; only "as played" cancellers legal |
| **During Action** | Yes | Impulse (resets on any play) | Stealth/intercept subject to "only when needed" rule; see Blocking |
| **Resolution** | No | Deterministic | No player interaction; two branches (see below) |
| **Action Continuing** | No | Sequencing (ABC) | Fires when a "continue the action" effect (e.g. Form of Mist) is played; see below |
| **After Resolution** | No | Sequencing (ABC) | One effect at a time; Freak Drive, Voter Captivation, etc. |

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

Most card plays occur within an **impulse window**. The exception is the As Announced window (Section B below), which uses **sequencing** (ABC priority) — impulse does not exist until the During Action state begins. A player may only play a card when they hold the impulse or sequencing priority. The pass order and return-to-current-player-after-resolution rules are defined in [game-state.md § Impulse window](game-state.md#impulse-window-phase-level).

---

## Basic Minion Actions

Any minion may perform these actions without an action card. All actions except bleed default to +1 stealth.

| Action | Who | Default stealth | Effect |
|---|---|---|---|
| **Bleed** | Any minion | +0 | Target prey burns pool equal to bleed amount (default 1). Acting player gains (or keeps) the Edge if they bleed for 1+ pool. |
| **Hunt** | Vampires only | +1 | Vampire gains 1 blood from the bank (excess burned if over capacity). |
| **Equip** | Any minion | +1 | Move an equipment card from hand or from another minion the player controls onto this minion. |
| **Employ Retainer** | Any minion | +1 | Place a retainer card from hand onto this minion with life counters as specified. |
| **Recruit Ally** | Any minion | +1 | Place an ally card from hand into the uncontrolled region with life counters as specified. |
| **Political Action** | Vampires only | +1 | Requires a political action card. Initiates a referendum; see [Referendum](#referendum). |

Basic actions other than bleed are repeatable by the same minion in a turn (NRA does not apply to hunt, equip with different equipment, or recruit different allies/retainers).

---

## Blocking

### Directed vs undirected actions

Every action is either directed (targets a specific Methuselah or cards they control) or undirected (no specific Methuselah target).

| Action type | Who may attempt to block |
|---|---|
| **Directed** | Only the targeted Methuselah's ready, unlocked minions |
| **Undirected** | Prey first; if prey passes, predator may attempt; others clockwise if applicable |

Once a Methuselah decides not to make any further block attempts against a given action, that decision is final — they cannot re-enter the block attempt sequence for that action.

### Block attempt protocol

1. A Methuselah declares one of their ready, unlocked minions as the blocker.
2. Stealth and intercept modifiers may be played (subject to the "only when needed" rule below).
3. If the blocker's final intercept ≥ the acting minion's final stealth → the action is **blocked**; the blocker locks.
4. If stealth exceeds intercept → the block attempt fails; the blocker does **not** lock; next eligible Methuselah may attempt.
5. If all eligible Methuselahs pass without a successful block → the action succeeds and enters Resolution.

A single Methuselah may make multiple successive attempts with different minions.

### Stealth and intercept — "only when needed"

Stealth and intercept can only be added **when they are needed** — the current totals must make it necessary:

- **Stealth** (action modifier) — may only be played when a block attempt is active **and** the blocker's current intercept ≥ the actor's current stealth (i.e. the block would currently succeed).
- **Intercept** (reaction) — may only be played during a block attempt **and** the actor's current stealth > the blocker's current intercept (i.e. the block would currently fail).

Default stealth and intercept are both 0, unless the action has an inherent stealth bonus (see Basic Minion Actions above).

---

## Playing a Card — Step by Step

Based on [Detailed Play Summary §1.6](https://www.vekn.net/detailed-play-summary).

### B — Declaration ("as played" phase)

1. The playing player fully declares all attributes of the card: targets, modes, and cost. The cost must be payable at the time of declaration for the play to be legal.
2. The card leaves the hand immediately — hand size drops by 1.
3. This opens a narrow window for **"as it is played" / "as announced" cancellers only** (e.g. Direct Intervention). No other cards or effects may be played at this step.
4. If the card is cancelled here → see [Cancelled Cards](#cancelled-cards) below.

> **Interrupt Layer note:** These cancellers form an independent interrupt layer that is orthogonal to the action state machine and to impulse/sequencing. They intercept card play at the moment of declaration, regardless of which action state is active or who holds priority. They do not interact with the impulse loop and do not consume or transfer sequencing priority.

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

### "Do Not Replace" Conditions

Some cards delay the replacement draw. The condition is stated in the card text and is one of the following:

| Card text pattern | Replacement trigger |
|---|---|
| `"Do not replace until after this action."` | After the current action resolves |
| `"Do not replace until after combat."` | After the current combat ends |
| `"Do not replace until after the current turn."` | At the end of the current player's turn |
| `"Do not replace until your next discard phase."` | At the start of the playing player's next DISCARD phase |
| `"Do not replace until your next unlock phase."` | At the start of the playing player's next UNLOCK phase |
| `"Do not replace until [game event]."` | When the named event occurs (e.g. a vampire commits diablerie, a vampire successfully hunts, a Methuselah is ousted) |
| `"Do not replace as long as this card is in play."` | Never (card stays unreplaced while the card remains in play) |

Cancellation voids any "do not replace" clause — a cancelled card is always replaced normally.

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

The NRA lock **persists through mid-turn unlocks**. If a vampire unlocks during the turn (via Freak Drive, As the Crow, or any other effect) and takes another action, it still cannot use the same action card it already resolved earlier that turn.

### When the NRA locks in

NRA is triggered at the **Complete Action** step — after block attempts are resolved, before paying cost. Cancellation before resolution does **not** trigger NRA; the minion may attempt the same action again.

### Complete Action sequence (from Detailed Play Summary §D)

1. NRA fires — acting minion is locked out of this action type for the rest of the turn.
2. Then:
   - **Not blocked** → pay cost → resolve action.
   - **Blocked** → action card burned (cost not paid) → blocker locks → combat begins (exception: if the acting minion is in torpor, there is no combat — the blocking player may choose to diablerize instead; see Leave Torpor).

### Two separate tracking mechanisms

| Mechanism                | Triggered                 | Scope                       | Cancelled card counts? |
|--------------------------|---------------------------|-----------------------------|------------------------|
| "As played" by card name | Declaration (Section B)   | Per explicit card-text rule | Yes                    |
| NRA lock                 | Action reaches resolution | Per minion, per turn        | No                     |

---

## Limited Effects

Source: VEKN Rulebook — Bleed and Additional Strikes.

Some cumulative effects are forbidden by the rules. A card is "limited" if it cannot stack with another card or effect of the same limited type. The card text marks this with `"(limited)"`.

Two specific limited categories exist:

| Category | Rule |
|---|---|
| **Bleed increase (limited)** | During a bleed action, at most one action modifier may increase the bleed amount via a "limited" source. A second "(limited)" bleed modifier cannot be played if the bleed is already being increased by another "(limited)" modifier. |
| **Additional strikes (limited)** | A minion cannot gain additional strikes per round from more than one "(limited)" source. |

A card that does **not** include `"(limited)"` in its text does not count against these limits and may be played alongside a limited card.

Implementation note: the engine must track per-action whether a limited bleed modifier has already been played, and per-combat-round whether a limited additional-strike source has already been used.

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
| `POLITICAL` (polling only)   | `MINION` — referendum polling step only                   | Any Methuselah with votes/ballots       | HAND                 |
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
- Playing a Conviction card attaches that card onto a ready Imbued the player controls.
- When an Imbued enters play with no conviction, then that player may search their hand, library, or ash heap for a conviction card to attach to that Imbued.

### Locked Minion Reaction Exception

The default rule is that only **ready** (unlocked) minions may play reaction cards. Some reaction cards explicitly override this with the text `"Usable by a locked minion."` When that text is present the locked minion may play the reaction despite not being ready. No other reaction card may be played by a locked minion.

### Wake Effects

A **wake effect** is a special reaction card (e.g. On the Qui Vive, Forced Awakening) that allows a locked minion to become temporarily ready during another Methuselah's action:

- Wake cards are played in the "as played" interrupt layer — the same narrow window as cancellers — allowing them to be played by a locked minion as soon as an eligible action is declared.
- Once awake, the minion is treated as ready for the duration of that action: they may play further reaction cards and attempt to block.
- If the minion blocks and combat results, they remain engaged in combat normally.
- At the end of the action (when the action lifecycle closes), a woken minion locks again if the wake card's text specifies it (most wake cards specify "until the end of the action" or similar).

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
- "after combat ends, if blocked" (valid only when a block occurred)

A player may freely choose the order in which their eligible After Resolution effects resolve. Order matters only when one effect would cancel or invalidate another.

### Triggered abilities check their preconditions at trigger time

An "after resolution" triggered ability (e.g. Lutz von Hohenzollern's special) verifies its preconditions **at the moment it would fire**, not at the moment the action resolved. If the triggering condition is no longer true when the After Resolution window opens (e.g. the vampire is no longer ready because the referendum ousted its controller), the ability does not trigger.

### Typical effects that fire in this window

| Card / Effect | Trigger condition |
|---|---|
| Freak Drive | After the acting minion's action resolves (success or block) |
| Voter Captivation | After a successful political action |
| Form of Mist | After combat ends, if this vampire was blocked |
| Cats' Guidance | After block resolution (remains valid after action continuation) |
| Lutz von Hohenzollern | After a successful referendum (checks readiness at trigger time) |
| "After this action" effects | Any card text specifying this window |

No further block attempts, stealth/intercept plays, or action modifiers are legal here — those windows have closed.

---

## Referendum

A referendum is initiated by a successful political action. It proceeds through three mandatory steps.

### Step 1 — Choose Terms

The terms of the referendum are chosen by the acting vampire's controller **after** the action is confirmed unblocked (not at announcement). If the political action card offers choices (e.g. which player to affect), those choices are made here.

### Step 2 — Polling

1. **"Before votes and ballots are cast" effects** — a distinct sub-window fires first. Cards with this explicit trigger are played now, before any votes are cast, following ABC sequencing.
2. **Votes and ballots are cast** — any Methuselah may cast their available votes/ballots in any order. There is no obligation to vote. Votes are irreversible once cast.
3. Cards marked **"only usable during a political action"** are legal only during this polling step (they cannot be played after polling closes).

### Step 3 — Resolution

- More votes **for** than **against** → referendum passes; effects take place.
- Tied or more votes **against** → referendum fails; no effect.

### Vote sources

| Source | Votes |
|---|---|
| Political action card | 1 per Methuselah (burn the card) |
| Primogen / Bishop | 1 per ready vampire |
| Prince / Baron / Archbishop | 2 per ready vampire |
| Justicar / Cardinal | 3 per ready vampire |
| Inner Circle / Regent | 4 per ready vampire |
| The Edge | 1 (burn the Edge to gain it) |
| Card effects | As specified |

Torpored vampires cannot cast votes (they must abstain).

### The Edge

The Edge is a game token that passes between players during bleed actions:
- The acting player takes the Edge whenever their bleed action resolves for 1 or more pool damage (whether successful or the Edge is already held by another player).
- During referendum polling the Edge-holder may burn the Edge to gain 1 vote.
- Only one player holds the Edge at a time; it starts the game with no owner.

---

## Combat

Combat occurs when a block attempt succeeds (or a rush action resolves). Full combat mechanics — round sequence, range, strike types, damage, torpor, Leave Torpor, and diablerie — are documented in [combat.md](combat.md).

**Summary relevant to card play timing:**
- The acting minion has first priority (ABC: A) at every combat step.
- Steps 1 (Before Range) and 2 (Determine Range) are each passed independently per player; Step 3 (Before Strikes) is passed implicitly.
- Default at end of each round: combat ends. A press-to-continue card forces another round; a press-to-end cancels it.
- Combat must fully resolve before the action lifecycle leaves the Resolution state and enters After Resolution.

---

## Implementation Status

Phase enforcement is not yet implemented. `PlayCard` currently accepts any card from `HAND` in any phase. See [vtes-mechanics-gaps.md](vtes-mechanics-gaps.md) §11 for the full gap list and proposed work.

Missing enum values that must be added before enforcement can be implemented:
- `CardType.CONVICTION` — currently maps to `CardType.NONE` in `GameInitService.toCardType()`
- `CardType.POWER` — currently maps to `CardType.NONE` in `GameInitService.toCardType()`
