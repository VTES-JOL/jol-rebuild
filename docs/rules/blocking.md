# Blocking and Reactions

Use this document when deciding who may block an action, how block attempts proceed, how stealth/intercept are played, how redirects behave, and when locked minions may react.

For the acting minion's action lifecycle, see [Actions](./actions.md). For generic reaction card timing and replacement, see [Card Timing and Card Types](./card-play.md). For combat after a successful block, see [Combat](./combat.md).

---

## Directed vs Undirected Actions

Every action is either directed (targets one or more Methuselahs or things they control) or undirected (no opposing Methuselah target).

| Action type    | Who may attempt to block                                                                                                                                                                                      |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Directed**   | Only the targeted Methuselah(s), or the Methuselah(s) who control the targeted thing(s), may attempt to block with ready, unlocked minions, unless card text explicitly allows another Methuselah to attempt. |
| **Undirected** | Prey first, then predator; no other Methuselahs may attempt unless card text explicitly allows it.                                                                                                            |

**Determining action direction:**

- **Bleed** is directed toward the prey by default. A small number of card effects can choose or redirect a bleed to a different Methuselah; the card text specifies the new target.
- **Other actions** are directed or undirected by card text. If the card text names one or more specific players, player-controlled cards, or player-controlled minions as targets, the action is directed toward those players.
- If the card text does not specify a particular Methuselah or their cards as a target, the action is undirected.

For a directed action with more than one eligible blocking Methuselah, block opportunities are offered in clockwise order from the acting Methuselah. Each targeted Methuselah may make block attempts only while their current block opportunity remains open; once they decline further attempts for that window, the opportunity passes to the next eligible targeted Methuselah.

Once a Methuselah decides not to make any further block attempts against a given action **within the current block window**, that decision is final for that window. See [Action Redirects](#action-redirects) for what happens when the action is redirected to a new target.

---

## Block Attempt Protocol

1. A Methuselah declares one eligible minion as the blocker. This is normally a ready, unlocked minion; wake-style effects can allow a locked minion to attempt to block as though unlocked.
2. Stealth and intercept modifiers may be played, subject to the "only when needed" rule.
3. If the blocker's final intercept is greater than or equal to the acting minion's final stealth, the action is **blocked**. As part of block resolution, the blocker is locked and enters combat with the acting minion. This does not require the blocker to have been unlocked before the attempt; a locked minion blocking via a wake-style effect remains locked.
4. If stealth exceeds intercept, the block attempt fails; the blocker does **not** lock. The next eligible Methuselah may attempt.
5. If all eligible Methuselahs pass without a successful block, the action succeeds and enters Resolution.

A single Methuselah may make multiple successive attempts with different minions while that Methuselah's block opportunity remains open.

---

## Modifier Persistence

All action modifiers and reactions that affect the action accumulate over the **entire action lifecycle** and are never reset while the action is in progress. This includes:

- **Stealth** - the acting minion's stealth total carries forward through all block windows, including after a redirect.
- **Intercept** - a minion's intercept total carries forward, even if the action was redirected away from their controller and then back.
- **Bleed amount** - increases and decreases applied by modifiers and reactions persist.
- **Other modifiers** - any other action modifier or reaction already played remains in effect regardless of redirects or additional block windows.

The "only when needed" rule applies to each new block attempt based on the **current accumulated totals**, not the starting values.

---

## Action Redirects

Some reaction cards allow a Methuselah to redirect an action to a different target. When a redirect occurs:

- All accumulated modifiers (stealth, intercept, bleed amount, etc.) **carry over**; nothing resets.
- A new block window opens with the **new target** Methuselah.
- Any Methuselah who passed on blocking during a **previous** block window for this action is **not** automatically excluded from the new window. If the action is redirected back to a player who previously passed, all of that player's eligible minions may attempt to block again. The prior pass applies only to the window in which it was made.
- The exception is any minion that carries an explicit "cannot attempt to block" restriction from a card effect. That restriction persists for the duration of the action.

**Example sequence (bleed redirected away and back):**

1. Player 1 declares a directed bleed at Player 2 with 1 stealth.
2. Minion A (Player 2) wakes and declines to block; it is no longer eligible in this block window.
3. Minion B (Player 2) attempts to block with 1 intercept; Player 1 plays +1 stealth (now 2 stealth); Player 2 passes and the block window closes.
4. Player 2 plays a reaction redirecting the bleed to Player 3. Accumulated stealth is 2.
5. Player 3 declines to block and plays a reaction redirecting the bleed back to Player 2.
6. A new block window opens for Player 2. **Both Minion A and Minion B are eligible again.** Minion B still has 1 intercept; the acting minion still has 2 stealth.
7. Modifiers, including additional bleed increases subject to the limited rule, may still be played during this new block window.

---

## Stealth and Intercept

Stealth and intercept can only be added **when they are needed**. The current totals must make the play or effect necessary:

- **Stealth** (action modifier or effect) may only be played or used when a block attempt is active **and** the blocker's current intercept is greater than or equal to the actor's current stealth.
- **Intercept** (reaction or effect) may only be played or used during a block attempt **and** the actor's current stealth is greater than the blocker's current intercept.

This rule is a timing gate, not a cap on the amount granted by a legal single effect. If one legal card or effect grants more stealth or intercept than the minimum needed, the full amount is applied. For example, `Forgotten Labyrinth` can raise a default +1 stealth political action to +3 stealth at basic Obfuscate or +4 stealth at superior Obfuscate when stealth is needed, because the extra stealth is produced by one effect.

After each stealth or intercept effect resolves, recalculate the current totals before allowing another stealth or intercept effect:

- If the blocking minion's current intercept is still greater than or equal to the acting minion's current stealth, the block would still succeed, so the acting minion may play or use another otherwise-legal stealth effect.
- If the acting minion's current stealth is still greater than the blocking minion's current intercept, the block attempt would still fail, so the blocking minion may play or use another otherwise-legal intercept effect.

Example: if the blocker has 3 intercept and the acting minion has 1 stealth, the acting minion may play a +1 stealth effect, moving to 2 stealth. Because 3 intercept would still block 2 stealth, stealth is still needed and another otherwise-legal stealth effect may be played. Once the acting minion's stealth exceeds the blocker's intercept, no more stealth is needed for that block attempt unless the blocker adds more intercept.

Card text can explicitly override the timing gate. If a card says it can be played or used even when stealth or intercept is not yet needed, that text takes precedence over the default rulebook restriction.

Default stealth and intercept are both 0, unless the action has an inherent stealth bonus.

---

## Reaction Eligibility

The default rule is that only **ready, unlocked** minions may play reaction cards. Some reaction cards explicitly override this with the text `"Usable by a locked minion."` When that text is present, the locked minion may play the reaction despite being locked. No other reaction card may be played by a locked minion.

Action modifiers and reactions are asymmetric:

- **Action Modifier** - only the acting player may play these. They supplement the action their minion is taking.
- **Reaction** - any player except the acting player may play these in response to the declared action.

---

## Wake Effects

A **wake effect** is a special reaction card (e.g. On the Qui Vive, Forced Awakening) that allows a locked minion to react during another Methuselah's action as though unlocked:

- Wake cards are played in the "as played" interrupt layer, allowing them to be played by a locked minion as soon as an eligible action is declared.
- A wake effect does not unlock the minion or change its ready/locked state. It grants permission for the minion to play further reaction cards and attempt to block as though unlocked for the duration specified by the card.
- If the minion blocks and combat results, they remain engaged in combat normally.
- At the end of the action, the permission expires. Any additional lock/unlock or penalty text on the wake card is then applied as specified.
