# Timing Windows — Implementation

Documents the rules-enforced workflow windows used to decide when a card or effect can be played. This is an implementation taxonomy, not a replacement for card text: card text remains authoritative and may create narrower timing inside one of these windows.

See [Card Play](./card-play.md) for type and phase gates, [Actions](./actions.md) for the action lifecycle, [Combat](./combat.md) for combat state, and [Referendums](./referendums.md) for political actions and blood hunts.

---

## Principles

- A card's **initial play window** is the window where that card leaves hand or another legal source and is declared.
- Effects created after the card is in play are not part of the card's initial play window. For example, equipment is initially played as a minion-phase action, even if it later grants a combat strike.
- A workflow may open nested workflows. Combat can open diablerie; diablerie opens blood hunt; a political action opens a referendum.
- Replacement and interruption windows happen before the pending result is committed. For example, `COMBAT_WOULD_GO_TO_TORPOR` opens before the vampire is moved to TORPOR.

---

## Workflow Ownership

| Concern                                                            | Owning document / state                                    |
|--------------------------------------------------------------------|------------------------------------------------------------|
| Card leaves hand, as-played cancellation, replacement, destination | [Card Play](./card-play.md)                                |
| Declaring actions, NRA, action success, after-resolution           | [Actions](./actions.md) / `PendingActionState`             |
| Block attempts, stealth/intercept, redirects, blocks declined      | [Blocking](./blocking.md) / `PendingActionState`           |
| Range, strikes, damage, presses, combat ending                     | [Combat](./combat.md) / `CombatState`                      |
| Diablerie sequence and blood hunt trigger                          | [Combat](./combat.md#diablerie) or future `DiablerieState` |
| Political and blood hunt polling/tally                             | [Referendums](./referendums.md) / `ReferendumState`        |
| Cross-workflow order and canonical window names                    | This document                                              |

The workflow owner opens and closes timing windows. [Card Play](./card-play.md) validates that the chosen card mode is legal in the current window and then handles declaration, cancellation, replacement, cost, and destination.

---

## Active Timing Window

Rules-enforced card play should validate against a single active timing surface. At any moment, at most one of these should be open for card/effect play:

```text
ActiveTimingWindow
  workflow: ACTION | BLOCKING | COMBAT | REFERENDUM | DIABLERIE | BLOOD_HUNT
  windowType: CARD_AS_PLAYED_CANCEL_WINDOW | ACTION_AS_ANNOUNCED | ...
  prioritySystem: IMPULSE | SEQUENCING | DETERMINISTIC
  actingPlayer: String
  priorityHolder: String?
  sourceStateRef: PendingActionState | CombatState | ReferendumState | DiablerieState?
  allowedCardTypes: Set<CardType>
  allowedModePredicates: card-text/mode checks for the exact window
```

A card mode is playable only if all layers pass:

1. Source region is legal.
2. Phase, type, and actor gates pass.
3. Requirements are met and declaration costs are payable.
4. The current `ActiveTimingWindow` permits that mode.
5. The player holds the active impulse or sequencing priority, unless the command is deterministic or administrative.

This separates generic card lifecycle from workflow timing. For example, a reaction card is not legal merely because the game is in the minion phase and the player is not the acting player; it must also match the active action, block, referendum, or as-played window.

---

## Unified Action State Diagram

The canonical diagram source is [action-state-machine.puml](./action-state-machine.puml).

```bash
plantuml -tsvg docs/implementation/action-state-machine.puml
```

---

## Action Workflow

```text
1. Declare action
   - If an action card is played:
     CARD_AS_PLAYED_CANCEL_WINDOW
     — e.g. Direct Intervention (out-of-turn master, cancel an action card as played)

2. Action is announced
   ACTION_AS_ANNOUNCED
   — e.g. Consign to Oblivion (cancel the announced action), Day Operation (prevent blocks at announcement)

3. During action and block attempts
   ACTION_DURING_ACTION
   — e.g. Conditioning (bleed modifier, only usable during a bleed action)
   ACTION_BLOCK_ATTEMPT
   — e.g. Eagle's Sight (reaction, +1 intercept when block attempt is declared)
   ACTION_STEALTH_INTERCEPT
   — e.g. Resist Earth's Grasp [CEL sup] (+1 stealth during stealth/intercept exchange)

4. All eligible blockers decline
   ACTION_BLOCKS_DECLINED
   — e.g. Deflection (redirect bleed after blocks declined), Telepathic Misdirection [AUS sup]

5A. If unblocked
   ACTION_RESOLUTION_SUCCESS

5B. If blocked
   ACTION_BLOCK_RESOLUTION_PRE_COMBAT
   — e.g. Massassi's Honor (only usable when this vampire is blocked, play before combat if any)
   -> enter Combat Workflow

6. After action resolution
   ACTION_AFTER_RESOLUTION
   — e.g. Freak Drive (unlock acting vampire after successful action)
```

`ACTION_BLOCK_RESOLUTION_PRE_COMBAT` is a narrow implementation hook for card text playable after a block succeeds but before the resulting combat starts, including text such as "play before combat" or "when this vampire is successfully blocked." It is not a general official phase where arbitrary action modifiers or reactions become legal.

---

## Combat Workflow

```text
1. Combat starts

2. Round begins
   COMBAT_BEFORE_RANGE
   — e.g. Carrion Crows (place before range; damages opposing minion each round)

3. Determine range
   COMBAT_DETERMINE_RANGE
   — e.g. Flash [CEL] (maneuver or press)

4. Before strikes
   COMBAT_BEFORE_STRIKES
   — e.g. Immortal Grapple (grapple, only at close range before strikes are chosen)

5. Choose / declare strikes
   COMBAT_STRIKE_DECLARATION
   — e.g. Theft of Vitae (strike: steal 2 blood from opposing vampire)

6. Before strike resolution
   COMBAT_BEFORE_STRIKE_RESOLUTION

7. Resolve strikes

8. Damage prevention and damage handling
   COMBAT_DAMAGE_PREVENTION
   — e.g. Forearm Block (prevent 2 damage from opposing minion's next hand strike)
   COMBAT_DAMAGE_RESOLUTION

9. If the result would move a vampire to torpor
   COMBAT_WOULD_GO_TO_TORPOR
   — e.g. Amaranth (replace pending torpor result with diablerie)

10. If the result would burn a minion
   COMBAT_WOULD_BE_BURNED
   — e.g. Reform Body (usable if this vampire would be burned; avoid the burn)

11. Commit final result
   - vampire moves to TORPOR
   - minion moves to ASH_HEAP
   - minion remains ready

12. Additional strikes, if applicable
   COMBAT_ADDITIONAL_STRIKE_WINDOW
   — e.g. Blur [CEL sup] (2 additional strikes)
   -> repeat strike declaration and resolution for additional strikes

13. Press step
   COMBAT_PRESS_STEP
   — e.g. Psyche! (press to continue combat if both combatants are still ready)

14. End of round
   COMBAT_END_OF_ROUND

15. If no new round
   COMBAT_WOULD_END
   COMBAT_ENDS
   COMBAT_AFTER_ENDS

16. Return to enclosing workflow
   - if a card/effect continues the action: ACTION_CONTINUING
   - otherwise: ACTION_AFTER_RESOLUTION, if combat was nested in an action
```

`COMBAT_WOULD_GO_TO_TORPOR` and `COMBAT_WOULD_BE_BURNED` are result-replacement hooks inside combat. They are not diablerie hooks by themselves. Cards such as `Decapitate`, `Amaranth`, `Ashes to Ashes`, and `Reform Body` use these windows because they replace a pending torpor or burn result before it is committed.

---

## Combat-Caused Diablerie Workflow

Combat can create diablerie by replacing a torpor result or by another card-specific combat result. Once that happens, diablerie runs as a nested workflow.

```text
1. Combat result would move a vampire to torpor
   COMBAT_WOULD_GO_TO_TORPOR

2. A card or effect replaces torpor with diablerie

3. Diablerie begins
   DIABLERIE_BEING_COMMITTED

4. Diablerie cancellation/replacement
   DIABLERIE_CANCEL_OR_REPLACE

5. If not canceled, resolve diablerie
   - transfer victim blood
   - diablerist may take equipment
   - burn victim
   - discipline search, if applicable

6. After successful diablerie
   DIABLERIE_AFTER_SUCCESS

7. Red List Trophy award, if applicable
   TROPHY_AWARD_BEFORE_BLOOD_HUNT

8. Blood hunt referendum begins
   -> enter Blood Hunt Workflow

9. After the blood hunt fully resolves
   -> return to Combat Ending Flow, starting at COMBAT_END_OF_ROUND
```

`DIABLERIE_BEING_COMMITTED` belongs to the diablerie workflow, regardless of whether diablerie came from combat, a directed action, a blocked leave-torpor action, or card text.

Combat-caused diablerie does not skip combat-ending hooks. The diablerie and blood hunt are immediate once the combat result creates diablerie, but after the blood hunt finishes the enclosing combat still ends because at least one combatant is no longer ready. The workflow then runs `COMBAT_END_OF_ROUND`, `COMBAT_WOULD_END`, `COMBAT_ENDS`, and `COMBAT_AFTER_ENDS` before returning to the enclosing action.

---

## Action-Caused Diablerie Workflow

```text
1. Declare diablerie action or action effect
   CARD_AS_PLAYED_CANCEL_WINDOW, if a card is played

2. Run normal action workflow
   ACTION_AS_ANNOUNCED
   ACTION_DURING_ACTION
   ACTION_BLOCK_ATTEMPT
   ACTION_BLOCKS_DECLINED

3. If the action succeeds
   ACTION_RESOLUTION_SUCCESS

4. Diablerie begins
   DIABLERIE_BEING_COMMITTED

5. Diablerie cancellation/replacement
   DIABLERIE_CANCEL_OR_REPLACE

6. Resolve diablerie

7. After successful diablerie
   DIABLERIE_AFTER_SUCCESS

8. Red List Trophy award, if applicable
   TROPHY_AWARD_BEFORE_BLOOD_HUNT

9. Blood hunt referendum begins
   -> enter Blood Hunt Workflow

10. After the blood hunt fully resolves
   ACTION_AFTER_RESOLUTION
```

For a blocked leave-torpor action, the blocker may choose diablerie instead of combat. That choice enters the diablerie workflow at `DIABLERIE_BEING_COMMITTED`.

The diablerie workflow owns the blood hunt trigger regardless of source. `ResolveAction` may create an action-caused diablerie, but it should not be the only code path that opens blood hunt.

---

## Political Referendum Workflow

```text
1. Political action succeeds

2. Choose terms
   REFERENDUM_CHOOSE_TERMS

3. Before votes and ballots
   REFERENDUM_BEFORE_VOTES
   — e.g. Akunanse Kholo (usable during a referendum before votes and ballots are cast)

4. Polling
   REFERENDUM_POLLING
   — e.g. Absolute Tyranny [POT+PRE] (during polling step, +3 votes)

5. Tally votes and determine result
   REFERENDUM_RESOLUTION

6. Outcome-dependent referendum hooks
   REFERENDUM_AFTER_RESOLUTION
   — e.g. Amici Noctis (after referendum passes, recover the political action card from ash heap)

7. After action resolution
   ACTION_AFTER_RESOLUTION
```

Action modifiers and reactions that say "during a political action", "during a referendum", or "during the polling step" belong to the referendum workflow, not to ordinary stealth/intercept block-attempt timing.

---

## Blood Hunt Workflow

Blood hunt is referendum-like, but it is not a political action.

```text
1. Blood hunt is called after diablerie

2. Before votes and ballots
   BLOOD_HUNT_BEFORE_VOTES

3. Polling
   BLOOD_HUNT_POLLING

4. Tally votes and determine result
   BLOOD_HUNT_RESOLUTION

5. If the blood hunt passes and would burn the diablerist
   BLOOD_HUNT_WOULD_BURN_DIABLERIST
   — e.g. Lay Low (anarch diablerist avoids being burned by the blood hunt)

6. Commit final result
   - diablerist burns
   - diablerist survives

7. After blood hunt
   BLOOD_HUNT_AFTER_RESOLUTION
```

`BLOOD_HUNT_WOULD_BURN_DIABLERIST` is distinct from `COMBAT_WOULD_BE_BURNED`. The former is caused by a referendum result after diablerie; the latter is caused by combat damage or combat effects before the combat result is committed.

---

## Initial Card-Play Window Examples

| Example card / mode                         | Initial window                         | Notes                                                              |
|---------------------------------------------|----------------------------------------|--------------------------------------------------------------------|
| `.44 Magnum` as Equipment                   | `MINION_PHASE_DECLARE_ACTION`          | Later strike/maneuver text is generated by the equipped card       |
| Standard Master                             | `MASTER_PHASE`                         | Unless card text says out-of-turn                                  |
| Event                                       | `DISCARD_PHASE_EVENT`                  | Uses the discard phase event play                                  |
| `Direct Intervention` style canceller       | `CARD_AS_PLAYED_CANCEL_WINDOW`         | Restricted cancellation layer                                      |
| `Consign to Oblivion`                       | `ACTION_AS_ANNOUNCED`                  | Cancel an action as it is announced                                |
| `Day Operation`                             | `ACTION_AS_ANNOUNCED`                  | Prevent blocks by playing at announcement; caster goes to torpor   |
| `Conditioning`                              | `ACTION_DURING_ACTION`                 | Bleed modifier; only usable during a bleed action                  |
| `Eagle's Sight`                             | `ACTION_BLOCK_ATTEMPT`                 | Reaction; +1 intercept when a block attempt is declared            |
| `Resist Earth's Grasp` [CEL sup]            | `ACTION_STEALTH_INTERCEPT`             | +1 stealth during the stealth/intercept exchange                   |
| `Deflection` style bleed redirect           | `ACTION_BLOCKS_DECLINED`               | When text says after blocks are declined                           |
| `Massassi's Honor`                          | `ACTION_BLOCK_RESOLUTION_PRE_COMBAT`   | Only usable when this vampire is blocked, play before combat       |
| `Freak Drive`                               | `ACTION_AFTER_RESOLUTION`              | After action resolves                                              |
| `Carrion Crows`                             | `COMBAT_BEFORE_RANGE`                  | Explicit before-range combat card                                  |
| `Flash` [CEL]                               | `COMBAT_DETERMINE_RANGE`               | Maneuver or press                                                  |
| `Immortal Grapple`                          | `COMBAT_BEFORE_STRIKES`                | Grapple; only at close range before strikes are chosen             |
| `Theft of Vitae`                            | `COMBAT_STRIKE_DECLARATION`            | Strike: steal 2 blood from opposing vampire                        |
| `Forearm Block`                             | `COMBAT_DAMAGE_PREVENTION`             | Prevent 2 damage from opposing minion's next hand strike           |
| `Blur`                                      | `COMBAT_ADDITIONAL_STRIKE_WINDOW`      | Additional-strike source                                           |
| `Amaranth`                                  | `COMBAT_WOULD_GO_TO_TORPOR`            | Replaces pending torpor with diablerie                             |
| `Reform Body`                               | `COMBAT_WOULD_BE_BURNED`               | Usable if this vampire would be burned; avoid the burn             |
| `Psyche!`                                   | `COMBAT_PRESS_STEP`                    | Press to continue combat if both combatants are still ready        |
| `Crimson Fury`                              | `DIABLERIE_BEING_COMMITTED`            | Responds to a vampire being diablerized                            |
| `Absolute Tyranny` [POT+PRE]                | `REFERENDUM_POLLING`                   | During polling step, +3 votes                                      |
| `Akunanse Kholo`                            | `REFERENDUM_BEFORE_VOTES`              | Usable during referendum before votes and ballots are cast         |
| `Amici Noctis`                              | `REFERENDUM_AFTER_RESOLUTION`          | After referendum passes, recover the political action card         |
| `Lay Low`                                   | `BLOOD_HUNT_WOULD_BURN_DIABLERIST`     | Responds to blood hunt passing and burning the diablerist          |

---

## Naming Guidance

Prefer specific workflow windows over broad "interrupt" names. Specific names make legality checks easier to implement and test:

| Prefer                             | Avoid as canonical implementation state    |
|------------------------------------|--------------------------------------------|
| `COMBAT_WOULD_GO_TO_TORPOR`        | `COMBAT_BURN_OR_TORPOR_REPLACEMENT`        |
| `COMBAT_WOULD_BE_BURNED`           | `COMBAT_EVENT_REPLACEMENT_OR_INTERRUPTION` |
| `DIABLERIE_BEING_COMMITTED`        | `COMBAT_DIABLERIE_INTERRUPT`               |
| `BLOOD_HUNT_WOULD_BURN_DIABLERIST` | `REFERENDUM_INTERRUPT`                     |

Broad names can still be useful for CSV review buckets, but the engine should expose the narrower window that matches the workflow step.
