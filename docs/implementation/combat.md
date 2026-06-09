# Combat — Implementation Status

Documents the combat system implementation: range, strikes, damage resolution, press, torpor, and diablerie in JOL.

See [VTES Rules — Combat](../rules/combat.md) for the tabletop rules this implements.

---

## Current Status

Combat has no formal structure in JOL. The game engine tracks `pendingCombat` state but does not step through the seven-round sequence. Players currently simulate combat manually through counter adjustments and the `MoveToTorpor` / `BurnMinion` commands. Diablerie is handled by `BurnMinion` but the full resolution sequence is not automated.

---

## Missing Mechanics

### Combat System

| Mechanic                                                                                                                          | Rulebook reference          |
|-----------------------------------------------------------------------------------------------------------------------------------|-----------------------------|
| Close vs long range; default is close                                                                                             | Combat — Range              |
| Maneuvers to change range; a minion cannot play two maneuvers in a row                                                            | Combat — Maneuvers          |
| Strike declaration and resolution order (Combat Ends, first strike, normal strikes; simultaneous within the same class)           | Combat — Strikes            |
| First-strike resolution before normal strikes                                                                                     | Combat — First Strike       |
| Normal damage (vampires burn blood to mend) vs aggravated damage (cannot be mended by vampires; allies/retainers treat as normal) | Combat — Damage             |
| After prevention, unprevented normal damage is handled before unprevented aggravated damage                                       | Combat — Damage             |
| Additional strikes and the `(limited)` rule — at most one limited additional-strike source per minion per round                   | Combat — Additional Strikes |
| Damage prevention: halving effects and flat reductions applied in play order; fractional damage rounds up                         | Combat — Damage Prevention  |
| Steal Blood is not damage and cannot be prevented, but is cancelled by a dodge                                                    | Combat — Steal Blood        |
| Press to continue or end combat; a minion cannot play two presses in a row                                                        | Combat — Press              |
| End of Round (Step 7) effects fire even when combat ended prematurely via Combat Ends                                             | Combat — End of Round       |
| Aggravated damage handled while a vampire is wounded can cause destruction (must burn 1 blood per point to prevent)               | Combat — Aggravated Damage  |

### Diablerie

`BurnMinion` handles the physical removal, but the full diablerie resolution sequence is not automated.

| Mechanic                                                                                                                              | Rulebook reference   |
|---------------------------------------------------------------------------------------------------------------------------------------|----------------------|
| Victim's remaining blood transfers to the diablerist; excess over capacity is burned                                                  | Diablerie            |
| Diablerist may take any equipment on the victim                                                                                       | Diablerie            |
| Victim is burned and sent to ash heap; all remaining cards and counters on the victim are burned                                      | Diablerie            |
| If victim's capacity is strictly greater than diablerist's capacity, diablerist's controller may search for a master: Discipline card | Diablerie            |
| If victim is a Red List minion, Trophy awards are resolved before the blood hunt referendum                                           | Red List / Diablerie |
| Automatic blood hunt referendum is called after diablerie — see [Referendums](./referendums.md)                                       | Diablerie            |
| Blood Cursed vampires cannot commit diablerie                                                                                         | Minion Traits        |

---

## Proposed Commands

### Combat Sequence

| Command          | Fields                                         | Description                                                                                                                                        |
|------------------|------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| `EnterCombat`    | `attackerRef`, `defenderRef`                   | Begin a combat between two ready minions; sets `pendingCombat`                                                                                     |
| `Maneuver`       | `playerName`, `direction` (`CLOSE` \| `LONG`)  | Adjust range during the range-determination step                                                                                                   |
| `DeclareStrike`  | `playerName`, `strikeType`, `targetRef?`       | Commit a strike for this round (`HAND` \| `DODGE` \| `COMBAT_ENDS` \| `STEAL_BLOOD` \| `FIRST_STRIKE` \| `DESTROY_EQUIPMENT` \| `STEAL_EQUIPMENT`) |
| `ResolveStrikes` | —                                              | Resolve declared strikes in official strike-class order; apply damage and effects                                                                  |
| `ApplyDamage`    | `targetRef`, `amount`, `aggravated`            | Explicit damage step for card effects applied mid-combat                                                                                           |
| `Press`          | `playerName`, `decision` (`CONTINUE` \| `END`) | Press decision at end of a combat round                                                                                                            |
| `EndCombat`      | —                                              | Close the combat; clean up `pendingCombat` state                                                                                                   |

### Diablerie

| Command      | Fields                       | Description                                                                                                                                  |
|--------------|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `Diablerise` | `diableristRef`, `victimRef` | Full resolution: transfer blood, optionally transfer equipment, optionally gain discipline, then trigger blood hunt referendum automatically |

---

## Proposed State

A `PendingCombatState` on `GameData`:

| Field            | Type            | Description                        |
|------------------|-----------------|------------------------------------|
| `attackerRef`    | `CardRef`       | The attacking minion               |
| `defenderRef`    | `CardRef`       | The defending minion               |
| `range`          | `CLOSE \| LONG` | Current range for this round       |
| `round`          | int             | Current round number               |
| `attackerStrike` | Strike?         | Declared strike for the attacker   |
| `defenderStrike` | Strike?         | Declared strike for the defender   |
| `status`         | CombatStatus    | Current step in the round sequence |

**Combat queuing (FIFO):** Combat must fully resolve before the action lifecycle continues. If a card effect generates a new combat while `pendingCombat` is already active, the new combat is enqueued rather than nested. Add `combatQueue: List<CombatPair>` to `GameData`; `EnterCombat` appends to the queue when `pendingCombat` is already set, and `EndCombat` dequeues the next combat if one is waiting.
