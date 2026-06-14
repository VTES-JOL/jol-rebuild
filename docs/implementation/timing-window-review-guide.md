# Timing Window Review Guide

This is a reviewer-facing companion to [Timing Windows](./timing-windows.md). The state diagram remains the canonical implementation map; this guide presents the same mechanics as audit checklists and scenario tables for players, rules experts, and card-text reviewers.

Use this guide to answer three questions:

1. What visible game event is happening?
2. Which cards or effects may intervene at that point?
3. After that intervention resolves, where does the game return?

---

## Reading Model

The implementation has two layers:

| Layer | Reviewer question | Implementation owner |
|-------|-------------------|----------------------|
| Outer workflow | What part of the game are we resolving: action, block, combat, referendum, diablerie, or blood hunt? | Action, Blocking, Combat, Referendum, Diablerie, Blood Hunt |
| Nested card play | If a card is played here, can it be canceled as it is played, does it replace, when is cost paid, and where does the card go? | Card Play |

`CARD_AS_PLAYED` is the nested card-play cancellation layer. It is not a separate action, combat, or referendum step. A card can be played only when the outer workflow permits it; once declared, the nested card-play workflow opens `CARD_AS_PLAYED` for "as it is played" cancellers.

---

## Reviewer Checklist

For any card or effect, audit it in this order:

1. Identify the visible trigger in plain game language.
2. Choose the outer workflow that owns that trigger.
3. Choose the narrowest timing window inside that workflow.
4. Decide whether the effect is played from hand, used from play, or automatic.
5. If it is played, remember that `CARD_AS_PLAYED` opens before its effect resolves.
6. Confirm the return point after the effect resolves, cancels, replaces, or creates a subworkflow.

If two candidate windows look plausible, prefer the one closest to the pending event being modified. For example, a card replacing a vampire going to torpor belongs at `COMBAT_WOULD_GO_TO_TORPOR`, while a card responding to the later blood hunt belongs at `BLOOD_HUNT_WOULD_BURN_DIABLERIST`.

---

## Common Action Path

This table follows the usual unblocked or blocked action path in player-visible terms.

| Player-visible event | Review question | Timing window |
|----------------------|-----------------|---------------|
| Acting minion declares an action | Is an action card being played from hand? | Card Play opens `CARD_AS_PLAYED`, then returns to action declaration if not canceled |
| Action exists and targets/mode are fixed | Does card text respond to "as the action is announced"? | `ACTION_AS_ANNOUNCED` |
| Action is in progress before a successful block or final decline | Does card text say during the action, during a bleed, or modify the action? | `ACTION_DURING_ACTION` |
| A minion attempts to block | Does card text respond to the block attempt itself? | `ACTION_BLOCK_ATTEMPT` |
| Stealth and intercept are compared | Does card text add stealth, intercept, or interact with that exchange? | `ACTION_STEALTH_INTERCEPT` |
| All eligible blockers decline | Does card text say after blocks are declined or redirect the action? | `ACTION_BLOCKS_DECLINED` |
| A block succeeds before combat starts | Does card text say when blocked, successfully blocked, or before combat? | `ACTION_BLOCK_RESOLUTION_PRE_COMBAT` |
| Combat from the block finishes | Does a card continue the action after combat? | `ACTION_CONTINUING`, then return to `ACTION_DURING_ACTION` |
| The unblocked action resolves or fizzles | Does card text respond after action resolution? | `ACTION_AFTER_RESOLUTION` |

Key return points:

| Event result | Return point |
|--------------|--------------|
| Action card is canceled as played | Clear action state |
| Redirect changes the action target | Return to `ACTION_DURING_ACTION` for renewed block opportunities |
| Blocked action continues after combat | `ACTION_CONTINUING`, then `ACTION_DURING_ACTION` |
| Blocked action does not continue | `ACTION_AFTER_RESOLUTION` |
| Political action succeeds | Enter Political Referendum, then `ACTION_AFTER_RESOLUTION` |
| Diablerie action succeeds | Enter Diablerie, then Blood Hunt, then `ACTION_AFTER_RESOLUTION` |

---

## Common Combat Path

This table follows a normal combat round and separates strike timing from result replacement timing.

| Player-visible event | Review question | Timing window |
|----------------------|-----------------|---------------|
| Combat starts or a new round begins | Does card text say before range? | `COMBAT_BEFORE_RANGE` |
| Range is being set | Is the card a maneuver or range-setting effect? | `COMBAT_DETERMINE_RANGE` |
| Range is set, before strikes are chosen | Does card text say before strikes, grapple, or similar pre-strike timing? | `COMBAT_BEFORE_STRIKES` |
| Minions choose strikes | Is the card or effect itself a strike? | `COMBAT_STRIKE_DECLARATION` |
| Strikes are chosen but not resolved | Does card text cancel, change, or respond to a chosen strike before resolution? | `COMBAT_BEFORE_STRIKE_RESOLUTION` |
| Damage exists but is not finalized | Is damage prevented, reduced, or otherwise handled? | `COMBAT_DAMAGE_PREVENTION` or `COMBAT_DAMAGE_RESOLUTION` |
| A vampire would go to torpor | Does an effect replace that torpor result? | `COMBAT_WOULD_GO_TO_TORPOR` |
| A minion would be burned by combat | Does an effect replace or prevent that burn result? | `COMBAT_WOULD_BE_BURNED` |
| Combatants are still ready after strikes | Is an additional strike gained or used? | `COMBAT_ADDITIONAL_STRIKE` |
| No additional strike remains | Is a press used to continue or end combat? | `COMBAT_PRESS_STEP` |
| Round is ending | Does card text respond at end of round? | `COMBAT_END_OF_ROUND` |
| Combat would end | Does card text replace combat ending with a new round? | `COMBAT_WOULD_END` |
| Combat is still about to end | Does card text queue another combat after this one? | `COMBAT_ABOUT_TO_END` |
| Combat has ended | Does card text respond after combat ends? | `COMBAT_AFTER_ENDS` |

Key return points:

| Event result | Return point |
|--------------|--------------|
| Additional strike is gained or used | Return to `COMBAT_STRIKE_DECLARATION` |
| Press continues combat | Return to `COMBAT_BEFORE_RANGE` |
| Combat ending is replaced by a new round | Return to `COMBAT_BEFORE_RANGE` |
| Combat-created diablerie succeeds | Run Diablerie and Blood Hunt, then resume combat ending at `COMBAT_END_OF_ROUND` |
| Combat ends inside an action | Return to `ACTION_CONTINUING` if an effect continues the action; otherwise `ACTION_AFTER_RESOLUTION` |

---

## Diablerie And Blood Hunt Path

Use this table when the visible event is "a vampire is attempting diablerie", regardless of whether that attempt came from an action, a combat result, a blocked leave-torpor action, or card text.

| Player-visible event | Review question | Timing window |
|----------------------|-----------------|---------------|
| Diablerie attempt begins | Does card text cancel, replace, or respond to the diablerie attempt? | `DIABLERIE_CANCEL_OR_REPLACE` |
| Diablerie succeeds | Does card text respond after successful diablerie? | `DIABLERIE_AFTER_SUCCESS` |
| Red List trophy may be awarded | Is a trophy awarded before the blood hunt? | `TROPHY_AWARD_BEFORE_BLOOD_HUNT` |
| Blood hunt is called | Are only vote sources being counted? | `BLOOD_HUNT_POLLING` |
| Blood hunt result is determined | Did the blood hunt pass or fail? | `BLOOD_HUNT_RESOLUTION` |
| Passing blood hunt would burn the diablerist | Does card text prevent or replace that burn? | `BLOOD_HUNT_WOULD_BURN_DIABLERIST` |

Important distinction:

| Pending event | Correct window |
|---------------|----------------|
| Combat damage or a combat effect would burn a minion | `COMBAT_WOULD_BE_BURNED` |
| A blood hunt referendum would burn the diablerist | `BLOOD_HUNT_WOULD_BURN_DIABLERIST` |

---

## Political Referendum Path

Use this table only after a political action reaches successful action resolution.

| Player-visible event | Review question | Timing window |
|----------------------|-----------------|---------------|
| Terms are chosen | Are referendum terms, targets, or options being fixed? | `REFERENDUM_CHOOSE_TERMS` |
| Terms are fixed, before votes and ballots | Does card text say before votes, before ballots, or during a referendum before polling? | `REFERENDUM_BEFORE_VOTES` |
| Votes and ballots are being cast | Does card text add votes, ballots, or otherwise operate during polling? | `REFERENDUM_POLLING` |
| Votes are tallied | Is the referendum pass/fail result being determined? | `REFERENDUM_RESOLUTION` |
| Result exists | Does card text respond after the referendum passes, fails, or resolves? | `REFERENDUM_AFTER_RESOLUTION` |

Action modifiers and reactions that say "during a political action", "during a referendum", or "during the polling step" belong here once the political action has succeeded and the referendum has begun. They do not reopen ordinary stealth/intercept timing.

---

## Suggested Review Format

For external review, prefer short scenario cards instead of a single large diagram. Each scenario should contain:

```text
Scenario:
  A one-sentence player-visible situation.

Expected sequence:
  1. Window or deterministic step.
  2. Window or deterministic step.
  3. Return point.

Cards to test:
  - Example card or text pattern.

Questions for reviewers:
  - Is this the right timing surface?
  - Are any legal responses missing?
  - Does the return point match tabletop play?
```

Example:

```text
Scenario:
  A combat strike would send the opposing vampire to torpor, and Amaranth is played.

Expected sequence:
  1. COMBAT_DAMAGE_RESOLUTION determines that the vampire would go to torpor.
  2. COMBAT_WOULD_GO_TO_TORPOR opens for torpor replacement effects.
  3. Amaranth is played; Card Play opens CARD_AS_PLAYED for as-played cancellers.
  4. If Amaranth resolves, enter DIABLERIE_CANCEL_OR_REPLACE.
  5. If diablerie succeeds, run Blood Hunt.
  6. After Blood Hunt, return to combat ending at COMBAT_END_OF_ROUND.

Questions for reviewers:
  - Is Amaranth correctly treated as replacing torpor, not as a blood hunt card?
  - After the blood hunt, should combat still run its ending hooks?
```

---

## Alternative Visual Layouts

The PlantUML state diagram is useful as a canonical implementation map, but it is dense for rules review. These alternate image layouts can make the same mechanics easier to review.

For concrete PlantUML sketches of each option, see [Timing Window Visual Examples](./timing-window-visual-examples.md).

### 1. Swimlane Sequence

Best for the full action workflow.

Show each owner as a horizontal lane:

| Lane | Contains |
|------|----------|
| Acting minion / controller | Declare action, choose terms, pay cost, resolve effect |
| Other Methuselahs | Block attempts, reactions, votes, cancels |
| Card Play | `CARD_AS_PLAYED`, replacement, cost, destination |
| Combat | Combat subworkflow when a block succeeds |
| Referendum / Blood Hunt | Polling, tally, outcome hooks |

This layout makes ownership clear: reviewers can see when control moves from action handling into card play, combat, referendum, diablerie, or blood hunt.

Use for:

- Full "how to perform an action" overview
- Explaining why `CARD_AS_PLAYED` is nested inside other windows
- Showing return points after combat, referendum, or blood hunt

### 2. Subway Map

Best for high-level player-facing orientation.

Draw each workflow as a colored route:

| Route | Stops |
|-------|-------|
| Action line | announce, action in progress, block attempt, blocks declined, resolution, after resolution |
| Combat branch | before range, range, strikes, damage, press, end |
| Referendum branch | terms, before votes, polling, tally, after referendum |
| Diablerie branch | attempt, success, trophy, blood hunt |
| Card-play loop | as-played cancel, replacement, cost, destination |

Branches make nested workflows easier to understand than a full state-machine box. Use arrows back to the main line for return points.

Use for:

- One-page handout for players
- Showing common paths without every implementation edge
- Comparing normal action, political action, blocked action, and diablerie action

### 3. Timing Ladder

Best for a focused subset such as combat.

Use a vertical ladder where each rung is a timing surface in strict order. Put example cards beside each rung and replacement hooks beside the pending result they modify.

Example combat ladder:

```text
Before range          Carrion Crows
Determine range       Flash
Before strikes        Immortal Grapple
Declare strikes       Theft of Vitae
Before strike result  Blood to Water
Damage prevention     Forearm Block
Damage resolution
Would go to torpor    Amaranth
Would be burned       Reform Body
Additional strikes    Blur
Press                 Psyche! [cel]
End of round          Taste of Vitae
Would end             Telepathic Tracking [AUS]
About to end          Psyche! [CEL]
After ends            Form of Mist
```

Use for:

- Combat review
- Referendum review
- Blood hunt review
- Card-text timing classification

### 4. Scenario Trace Card

Best for reviewing edge cases one at a time.

Create one small image per scenario. Each card shows:

| Section | Content |
|---------|---------|
| Setup | One sentence describing the board state |
| Trace | 5-8 numbered boxes |
| Interventions | Small callouts for legal card windows |
| Return | Final box showing where the enclosing workflow resumes |
| Reviewer questions | 2-3 checks to confirm rules agreement |

Use for:

- Amaranth causing diablerie during combat
- Political action entering referendum
- Deflection after blocks are declined
- Blocked action continuing after combat
- Blood hunt passing and being replaced by Lay Low

### 5. Decision Tree

Best for answering "what happens next?"

Start from a single player-visible event and branch only on important outcomes:

```text
Action declared
  -> canceled as played?
  -> announced
     -> blocked?
        -> combat
           -> action continues?
           -> action ends?
     -> all decline?
        -> redirected?
        -> resolves?
```

This is less precise than the state diagram, but more digestible for readers who need to validate table behavior before implementation details.

Use for:

- Player-facing rules explanation
- Onboarding contributors
- Finding missing outcome branches

### 6. Window Matrix

Best for card-classification review.

Use a grid with workflows as columns and timing windows as rows or grouped cells. Put card examples inside each cell.

| Workflow | Early | Middle | Result / replacement | After |
|----------|-------|--------|----------------------|-------|
| Action | `ACTION_AS_ANNOUNCED` | `ACTION_DURING_ACTION`, block windows | `ACTION_RESOLUTION_SUCCESS` | `ACTION_AFTER_RESOLUTION` |
| Combat | `COMBAT_BEFORE_RANGE` | strikes, damage | torpor/burn replacement | end hooks |
| Referendum | choose terms | before votes, polling | resolution | after referendum |
| Diablerie | cancel/replace | resolve diablerie | trophy, blood hunt | enclosing return |

Use for:

- Auditing CSV timing buckets
- Identifying overloaded or missing windows
- Explaining which window owns a card text phrase

### Recommended Image Set

For external review, create a small set instead of one master diagram:

1. Subway map: full action workflow and branches.
2. Swimlane: action with nested card play, combat, referendum, diablerie, and blood hunt ownership.
3. Combat timing ladder: detailed combat window order.
4. Political action trace: action success into referendum, then return to action after-resolution.
5. Diablerie trace: combat-caused or action-caused diablerie into blood hunt, then return point.
6. Window matrix: card-text classification reference.

This gives reviewers both a broad mental model and focused images for the areas where timing mistakes are most likely.
