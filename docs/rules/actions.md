# Action Rules

Use this document when deciding what an acting minion may do, how an action proceeds, when it succeeds or fails, and what restrictions apply after an action resolves.

For block eligibility and stealth/intercept exchanges, see [Blocking](./blocking.md). For referendum polling and votes, see [Referendums](./referendums.md). For combat after a block or rush action, see [Combat](./combat.md). For generic card declaration, replacement, and cancellation rules, see [Card Timing and Card Types](./card-play.md).

---

## Minion Readiness

A **ready minion** is a minion in the ready region. Most minion activity also requires the minion to be unlocked and uncontested:

- **Ready region** - vampires in torpor are not ready; allies reduced to 0 life are burned.
- **Unlocked** - a locked minion normally cannot take actions, attempt blocks, or play reaction cards.
- **Not contested** - a contested unique card is out of play until the contest resolves; a contested title means the vampire is treated as having no title while the contest lasts.
- **Not burned** - the card is still in play.

Ready, unlocked minions may take actions, attempt blocks, and play reaction cards. Exceptions are card-text driven: wake effects can let locked minions react/block for an action, and a vampire in torpor may take the special Leave Torpor action.

---

## Basic Minion Actions

Any minion may perform these actions without an action card. All actions except bleed default to +1 stealth.

| Action               | Who           | Default stealth | Effect                                                                                                                                                                                                     |
|----------------------|---------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Bleed**            | Any minion    | +0              | Target Methuselah burns pool equal to bleed amount (vampires and imbued default 1, otherwise by card text). Acting player gains or keeps the Edge if the successful bleed has a bleed amount of 1 or more. |
| **Hunt**             | Vampires only | +1              | Vampire gains 1 blood from the bank up to their capacity. Any blood gained beyond capacity is burned.                                                                                                      |
| **Equip**            | Any minion    | +1              | Move an equipment card from hand or from another minion the player controls onto this minion.                                                                                                              |
| **Employ Retainer**  | Any minion    | +1              | Place a retainer card from hand onto this minion with life counters as specified.                                                                                                                          |
| **Recruit Ally**     | Any minion    | +1              | Place an ally card from hand into the ready region with life counters as specified. The recruited ally cannot act on the turn it is recruited.                                                             |
| **Political Action** | Vampires only | +1              | Requires a political action card or an option from a card in play. Initiates a referendum; see [Referendums](./referendums.md).                                                                            |

Basic actions other than bleed are repeatable by the same minion in a turn. NRA does not apply to hunt, equip with different equipment, or recruit different allies/retainers.

### Torpor-Related Actions

Two additional basic actions involve minions in or adjacent to torpor. These are not in the table above because they have different eligibility requirements.

| Action           | Who                                    | Default stealth | Effect                                                                                                                                                                                                                                                                                                      |
|------------------|----------------------------------------|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Leave Torpor** | Torpored vampire only                  | +1              | Costs 2 blood from the acting vampire. If the action succeeds, the vampire moves from torpor to the ready region. If blocked, no combat occurs — the blocking player's controller may instead choose to diablerize the torpored vampire. If they decline, the vampire stays in torpor and the action fails. |
| **Rescue**       | Any ready minion (not the ally itself) | +1              | Moves a torpored ally controlled by this minion's controller from torpor to the ready region. No blood cost for the rescuing minion. NRA applies — a minion may rescue a given ally only once per turn.                                                                                                     |

Leave Torpor is the only action a minion in torpor may take. Rescue applies only to allies (vampires in torpor cannot be rescued this way; they leave torpor through their own Leave Torpor action or via diablerie).

### Blood Capacity Overflow

A vampire's blood total can never exceed their current capacity. Any effect that would bring a vampire above capacity instead brings them to capacity; the excess blood is returned to the bank. This applies to hunt, blood gain from card effects, and any other source of blood.

---

## Action Lifecycle

Every action follows this state sequence:

```
Idle -> As Played -> As Announced -> During Action (Impulse Loop) -> Blocks Declined -> Resolution -> After Resolution -> End
```

For blocked actions that are continued (e.g. Form of Mist), the sequence expands:

```
... -> Resolution -> Action Continuing -> Block Attempts -> Resolution -> After Resolution -> End
```

| State                 | Impulse? | Priority system              | Notes                                                                                                                                         |
|-----------------------|----------|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| **As Played**         | Yes      | Impulse (restricted)         | Only if a card is played to announce the action. Restricted window for "as played" cancellers and wake effects; the card is not replaced yet. |
| **As Announced**      | Yes      | Impulse (resets on any play) | Only effects usable as the action is announced are legal; these resolve before regular action modifiers, reactions, and block attempts.       |
| **During Action**     | Yes      | Impulse (resets on any play) | Block attempts and normal action modifier/reaction play. Stealth/intercept subject to "only when needed" rule; see [Blocking](./blocking.md) |
| **Blocks Declined**   | Yes      | Impulse (resets on any play) | Final pre-resolution window after all eligible Methuselahs decline further block attempts. Target changes reopen block attempts; see [Blocking](./blocking.md) |
| **Resolution**        | No       | Deterministic                | No player interaction; two branches (see below)                                                                                               |
| **Action Continuing** | No       | Sequencing (ABC)             | Fires when a "continue the action" effect is played                                                                                           |
| **After Resolution**  | No       | Sequencing (ABC)             | One effect at a time; Freak Drive, Voter Captivation, etc.                                                                                    |

**ABC sequencing rule:** When multiple players may act simultaneously, priority goes: **A**cting/active player first -> **B**locking/defending player -> others **C**lockwise from the acting player. The window resets to A after each play.

**Resolution branches:**

- Action not blocked -> after the Blocks Declined window closes -> pay cost -> apply effect -> enter After Resolution.
- Action blocked -> combat subsystem (FIFO queue) -> when combat fully resolves -> enter After Resolution, or Action Continuing if a continue-the-action effect fires.

Combat must fully resolve before the lifecycle leaves Resolution.

### Action Continuing

When a "continue the action" effect fires after a blocked combat, the game enters **Action Continuing** before returning to Block Attempts:

- "After combat ends" and "after block resolution" effects triggered by the **preceding** block are playable in this window, alongside the continue-the-action effect; there is no mandatory ordering between them.
- The game remembers the action was already blocked. Cards that trigger on block resolution (e.g. Cats' Guidance) remain valid after continuation, because the prior block already occurred.
- Returning to Block Attempts does **not** re-open the As Played, As Announced, or During Action windows from scratch; it resumes only at the block-attempt step.
- If the continued action is blocked again, combat resolves again and another Action Continuing window may open.

---

## Impulse During Actions

Card and effect plays occur within timing windows governed by impulse or sequencing. A player may only play a card when they hold the relevant impulse or sequencing priority. The pass order and return-to-acting-player-after-play rules are defined in [Game Flow § Impulse and Sequencing](./game-flow.md#impulse-and-sequencing).

---

## Action Success and Failure

An action has multiple layers of success that card effects may reference independently.

### Action-Level Success

An action is **successful** if it reaches the resolution phase, i.e. it was not blocked. A blocked action is **unsuccessful** at the action level, regardless of any other outcome.

### Bleed Action and Edge Movement

A bleed action is successful if the action is not blocked. Edge movement uses a separate rule: the acting Methuselah takes the Edge only when the successful bleed has a bleed amount of 1 or more.

Card text that refers to a "successful bleed" should be interpreted according to the current VEKN wording/rulings for that card. Do not use Edge movement as the generic definition of bleed-action success.

### Referendum Success

A referendum is **successful** if it passes, meaning more votes are cast for it than against it. A failed referendum is not a successful referendum even if the political action itself was successful and reached the referendum step unblocked.

### Combining Definitions

| Scenario                                                 | Action successful? | Bleed successful?      | Referendum successful? |
|----------------------------------------------------------|--------------------|------------------------|------------------------|
| Bleed for 3 reaches resolution, target loses 3 pool      | Yes                | Yes; Edge moves        | -                      |
| Bleed for 3 reaches resolution, reduced to 0 by reaction | Yes                | No; Edge does not move | -                      |
| Bleed blocked                                            | No                 | No                     | -                      |
| Political action reaches referendum, referendum passes   | Yes                | -                      | Yes                    |
| Political action reaches referendum, referendum fails    | Yes                | -                      | No                     |
| Political action blocked                                 | No                 | -                      | No                     |

Card effects that say "after a successful action" trigger on any action-level success. Effects that say "after a successful bleed" or "after a successful referendum" use their specific card-text/rules context.

---

## No Repeat Action (NRA)

The NRA rule limits what a **minion** may do on a given turn. It is tracked **per minion, per turn**, not per player.

### What NRA Locks Out

A minion cannot perform the same NRA-scoped action again this turn once it **reaches resolution** (blocked or unblocked):

| Action source             | NRA scope                                                                                                    |
|---------------------------|--------------------------------------------------------------------------------------------------------------|
| Basic bleed               | Once per minion per turn                                                                                     |
| Political action          | Once per vampire per turn                                                                                    |
| Action card from hand     | Same named action card once per minion per turn, unless the play is cancelled                                |
| Action via a card in play | Same action provided by the same in-play copy once per minion per turn, including the minion's own card text |

Actions not on this list (hunting, rescue, equip with different equipment, recruit different allies/retainers) may be repeated.

For NRA, **card in play** means a specific action ability on an in-play card or minion text that provides an action the minion can perform. It does not mean every effect printed on a card in the ready region is automatically limited to once per turn. Non-action effects, activated effects, and continuous effects follow their own card text, costs, timing windows, and any explicit "once each turn" limits.

The NRA lock **persists through mid-turn unlocks**. If a vampire unlocks during the turn and takes another action, it still cannot use the same named action card or same in-play action ability it already resolved earlier that turn.

### When NRA Locks In

NRA is triggered at the **Complete Action** step: after block attempts are resolved, before paying cost. Cancellation before resolution does **not** trigger NRA; the minion may attempt the same action again.

### Complete Action Sequence

1. NRA fires; the acting minion is locked out of this action type for the rest of the turn.
2. Then:
   - **Not blocked** -> pay cost -> resolve action.
   - **Blocked** -> action card burned (cost not paid) -> blocker locks -> combat begins. If the acting minion is in torpor, there is no combat; the blocking player may choose to diablerize instead. See [Combat § Leave Torpor action](./combat.md#leave-torpor-action).

### Two Separate Tracking Mechanisms

| Mechanism                | Triggered                 | Scope                       | Cancelled card counts? |
|--------------------------|---------------------------|-----------------------------|------------------------|
| "As played" by card name | Declaration               | Per explicit card-text rule | Yes                    |
| NRA lock                 | Action reaches resolution | Per minion, per turn        | No                     |

---

## After Resolution

After an action fully resolves, or is blocked and combat ends, the game enters the **After Resolution** state before the action lifecycle closes.

- Uses **sequencing (ABC priority)**, not impulse; the impulse loop has already ended.
- One card or effect resolves at a time; this is not an open loop.
- Only "after successful action" or "after resolution" effects are legal here.

### Equivalent Phrases

The following card-text phrases all refer to the same After Resolution window:

- "after action resolution" / "after this action"
- "after bleed resolution"
- "after referendum resolution"
- "after block resolution" (valid only when a block occurred)

A player may freely choose the order in which their eligible After Resolution effects resolve. Order matters only when one effect would cancel or invalidate another.

"After combat ends" effects are handled by the combat subsystem when combat ends. If such an effect continues the action after a block, the action enters **Action Continuing** before returning to block attempts.

### Trigger Preconditions

An "after resolution" triggered ability verifies its preconditions **at the moment it would fire**, not at the moment the action resolved. If the triggering condition is no longer true when the After Resolution window opens, the ability does not trigger.

### Typical Effects

| Card / Effect               | Trigger condition                                               |
|-----------------------------|-----------------------------------------------------------------|
| Freak Drive                 | After the acting minion's action resolves (success or block)    |
| Voter Captivation           | After a successful political action                             |
| Cats' Guidance              | After block resolution; remains valid after action continuation |
| Lutz von Hohenzollern       | After a successful referendum; checks readiness at trigger time |
| "After this action" effects | Any card text specifying this window                            |

No further block attempts, stealth/intercept plays, or action modifiers are legal here; those windows have closed.

---

## Source Notes

- [VEKN Rulebook § Minion Phase](https://www.vekn.net/rulebook) defines basic minion actions, default action stealth, bleed, hunt, equip, employ retainer, recruit ally, rescue/leave torpor, and political action basics.
- [VEKN Rulebook § Actions](https://www.vekn.net/rulebook) defines action declaration, blocking, successful action resolution, blocked action resolution, and the no-repeat-action rule.
- [VEKN Rulebook § The Edge](https://www.vekn.net/rulebook) defines Edge movement from successful bleeds with a bleed amount of 1 or more.
- [VEKN Detailed Play Summary §1.6](https://www.vekn.net/detailed-play-summary) is the basis for the card declaration, cancellation, replacement, and action-resolution timing model referenced by the lifecycle here.
- [VEKN Detailed Play Summary](https://www.vekn.net/detailed-play-summary) is used for sequencing/impulse vocabulary, after-resolution timing, and continuation-after-block protocol.
- Card-specific examples such as Freak Drive, Voter Captivation, Cats' Guidance, and Lutz von Hohenzollern should be checked against [VEKN Card Lists](https://www.vekn.net/card-lists) and the [VTES Rulings database](https://github.com/vtes-biased/vtes-rulings/blob/main/README.md), because current card text and card-specific rulings can refine exact trigger wording.
