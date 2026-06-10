# Combat — Implementation

Documents the combat system: range, maneuvers, strikes, damage resolution, press, torpor, and diablerie in JOL.

See [VTES Rules — Combat](../rules/combat.md) for the tabletop rules this implements.

---

## Current Status

Combat has no formal structure. Players simulate it manually using `MoveToTorpor`, `BurnMinion`, `AddCounter`, and `RemoveCounter`. The diablerie sequence is not automated. The full 7-step round must be designed as a new `CombatState` on `GameData`.

---

## CombatState

A new `CombatState` object is added to `GameData`. It is set when combat opens and cleared after `EndCombat`.

| Field                                   | Type            | Description                                                                                           |
|-----------------------------------------|-----------------|-------------------------------------------------------------------------------------------------------|
| `attackerRef`                           | `CardRef`       | The attacking minion (acts first at each step)                                                        |
| `defenderRef`                           | `CardRef`       | The defending minion                                                                                  |
| `round`                                 | `int`           | Current round number (starts at 1)                                                                    |
| `range`                                 | `Range`         | `CLOSE` or `LONG`; default `CLOSE` at start of each round                                            |
| `step`                                  | `CombatStep`    | Current position in the 7-step sequence                                                               |
| `attackerStrike`                        | `Strike?`       | Declared strike for this round; null until declared                                                   |
| `defenderStrike`                        | `Strike?`       | Declared strike for this round; null until declared                                                   |
| `attackerAdditionalStrikes`             | `int`           | Additional strike count remaining for attacker this round                                             |
| `defenderAdditionalStrikes`             | `int`           | Additional strike count remaining for defender this round                                             |
| `additionalStrikeLimitedUsed_attacker`  | `boolean`       | A `(limited)` additional-strike source was already used by attacker this round; reset each new round  |
| `additionalStrikeLimitedUsed_defender`  | `boolean`       | A `(limited)` additional-strike source was already used by defender this round; reset each new round  |
| `maneuverLastPlayedBy`                  | `String?`       | Card ID of the last minion to play a maneuver; enforces "cannot play two in a row"                    |
| `pendingDamage_attacker`                | `int`           | Normal damage accumulator for attacker this resolution step                                           |
| `pendingDamage_defender`                | `int`           | Normal damage accumulator for defender this resolution step                                           |
| `pendingAggravated_attacker`            | `int`           | Aggravated damage accumulator for attacker this resolution step                                       |
| `pendingAggravated_defender`            | `int`           | Aggravated damage accumulator for defender this resolution step                                       |

### Enums

**`Range`:** `CLOSE`, `LONG`

**`CombatStep`:** `BEFORE_RANGE`, `DETERMINE_RANGE`, `BEFORE_STRIKES`, `STRIKE_DECLARATION`, `STRIKE_RESOLUTION`, `DAMAGE_RESOLUTION`, `PRESS`, `END_OF_ROUND`

**`StrikeType`:** `HAND`, `MELEE_WEAPON`, `FIREARM`, `OTHER_RANGED`, `FIXED_DAMAGE`, `DODGE`, `COMBAT_ENDS`, `FIRST_STRIKE`, `STEAL_BLOOD`, `ADDITIONAL`

### New Effect

`CombatStateChangedEffect` carrying the updated `CombatState` (or null when cleared). Applied by `GameEffectApplicator`.

### Combat queuing

If a card effect creates a new combat while `CombatState` is already active, the new combat is enqueued: `combatQueue: List<CombatPair>` on `GameData`. `StartCombat` appends to the queue when `combatState` is set. `EndCombat` dequeues the next entry if one is waiting.

---

## Commands

| Command               | Fields                                          | Description                                                                                          |
|-----------------------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| `StartCombat`         | `attackerRef`, `defenderRef`                    | Open `CombatState`; triggered by block success or an "enter combat" action resolution                |
| `Maneuver`            | `combatantRef`, `toRange`                       | Change range to `CLOSE` or `LONG`; validated against "no two in a row" via `maneuverLastPlayedBy`   |
| `DeclareStrike`       | `combatantRef`, `strikeType`, `weaponRef?`      | Commit strike for this round; attacker declares first, then defender                                 |
| `DeclareAdditional`   | `combatantRef`, `strikeType`, `weaponRef?`      | Declare an additional strike for this round after initial strike resolution                          |
| `PreventDamage`       | `combatantRef`, `amount`                        | Apply damage prevention during damage resolution step                                                |
| `DeclarePress`        | `combatantRef`, `decision`                      | `CONTINUE` or `END`; if an uncontested `CONTINUE` remains after both players have acted, new round begins |
| `EndCombat`           | —                                               | Clear `CombatState`; dequeue next pending combat if any; return to action lifecycle                  |

---

## 7-Step Round Sequence

### Step 1 — Before Range

Cards with "before range is determined" timing. Impulse window with `COMBAT` context, acting minion first. Both combatants pass → advance to Step 2.

### Step 2 — Determine Range

Default range: `CLOSE`. Either combatant may `Maneuver` to change range. Maneuver rules:
- `maneuverLastPlayedBy` records the card ID of the last combatant to play a maneuver card. A combatant is locked from playing another maneuver until the **other** combatant plays one — passing without playing a maneuver does not reset the lock. If the other combatant passes without maneuvering, the first combatant cannot maneuver again that step.
- Only one weapon or strike card may maneuver per minion per round.
- If a maneuver comes from a card that also grants a strike, the minion must use that card's strike as their first strike for this round. This is validated at `DeclareStrike` time: if the minion used such a card in Step 2, their first strike must match; any other strike as the first is rejected.
- Some cards prevent maneuvers.

Both combatants pass without maneuvering → advance to Step 3. Final declared range stands for the rest of the round.

### Step 3 — Before Strikes

Cards with "before strikes are chosen" timing; range-dependent effects legal at the final range. Acting minion first; if either plays, impulse returns to acting minion. When both pass consecutively → initial strikes chosen (Step 4). Additional strikes in Step 4 do not re-open Step 3 unless a card explicitly creates that permission.

### Step 4 — Strike Declaration and Resolution

**Declaration:** attacker announces first, then defender. Each names one strike.

**Strike range validity:**
- Close-only by default (most hand strikes, melee weapon strikes, Steal Blood).
- Legal at close or long if the strike type is: ranged, dodge, Combat Ends, or card text says "long range."
- **Ranged** (`CardData.ranged = true`, a field to be added): set during card build when card text contains an `R` damage value (e.g. `"2R damage"`, `"Rdamage"`) or the phrase `"can be used at long range"` / `"(long range)"`. The `DeclareStrike` handler reads this flag.

**Resolution order:**
1. **Combat Ends** — resolves immediately; `EndCombat` fires; Step 7 effects still trigger.
2. **First Strike** — both first-strikers resolve simultaneously before normal strikes.
3. **Normal strikes** — all remaining resolve simultaneously.

If the defending minion is sent to torpor or burned by a first strike, their normal strike does not resolve.

**Additional strikes:** after all initial strikes (including first strikes) have resolved, if either combatant has `additionalStrikes > 0` the server opens a new declaration sub-window. Both combatants simultaneously declare one additional strike each; a combatant with 0 remaining additional strikes may not declare and is skipped. Both declared strikes resolve simultaneously, then `additionalStrikes` is decremented for each who declared. This repeats until both combatants have 0 remaining. Each additional resolution is independent; use same range as initial. Do not repeat Steps 1–3. `(limited)` additional-strike sources: at most one per combatant per round (tracked by `additionalStrikeLimitedUsed_attacker/defender`).

### Step 5 — Damage Resolution

Accumulate `pendingDamage` and `pendingAggravated` from all strikes. Prevention cards reduce accumulated damage before the mending step.

**Order of application:**
1. Normal damage handled first: vampire spends 1 blood per point to mend; ally loses life counters.
2. Aggravated damage handled after normal: cannot be mended.
   - First aggravated point on an unwounded vampire: marks as wounded (no blood cost).
   - Each aggravated point on a wounded vampire: must burn 1 blood to avoid destruction. If cannot burn enough blood → burned to ASH_HEAP.

**Torpor check:** after damage resolution, vampire with unmended normal damage goes to TORPOR (unless aggravated damage burned them outright).

**Steal Blood:** not damage; not preventable; cancelled by a Dodge. Moves blood/life counters from target to striker.

**Environmental damage:** damage with no `attackerRef` or `defenderRef` — produced by card text that says "this minion takes X damage" without an opposing minion as the source. Applied directly to `pendingDamage` (or `pendingAggravated` if the text says aggravated) for the affected combatant. Prevention cards may reduce it unless the card text says otherwise. Does not trigger "damage from a strike" effects.

### Step 6 — Press

Default: combat ends after every round. A combatant may `DeclarePress(CONTINUE)` to force another round. The opposing combatant may respond with `DeclarePress(END)` to cancel. A combatant cannot play two presses in a row.

If an uncontested `CONTINUE` remains → new round begins from Step 1. If no uncontested `CONTINUE` → combat ends.

### Step 7 — End of Round

"End of round" effects (e.g. Taste of Vitae, Disarm) fire here, even when combat ended prematurely via Combat Ends. This step fires before combat actually terminates.

---

## Strike Reference

| Strike type          | Range         | Damage basis                                   | Notes                                                       |
|----------------------|---------------|------------------------------------------------|-------------------------------------------------------------|
| Hand strike          | Close only    | Strength (default 1)                           | Can be long-range if text says so                           |
| Melee weapon         | Close only    | Bearer's strength ± weapon bonus               | Bonus specified in weapon card text (e.g. +1, aggravated)  |
| Firearm (gun)        | Close or long | Fixed `R` value from card                      | One optional maneuver to long range for most guns           |
| Other ranged         | Close or long | Fixed `R` value; not classed as gun            | No built-in maneuver unless card text states                |
| Fixed-damage weapon  | Close only    | Specific value, not strength-based             | Legal at long range only if card has `R` or "ranged" text   |
| Dodge                | Any           | No damage; cancels opposing strike on dodger   | Does not protect retainers                                  |
| Combat Ends          | Any           | No damage; ends combat before other strikes    | Always resolves first                                       |
| First Strike         | Any           | Per weapon/hand formula                        | Resolves before normal strikes; simultaneous with other first strikes |
| Steal Blood          | Close only    | Moves counters; not damage                     | Cannot be prevented; cancelled by Dodge                     |

---

## Damage Prevention

Played during Step 5. Prevention effects apply strictly in the order they are played. A flat reduction, halving effect, or other prevention effect modifies the damage total that remains at that moment; later prevention applies to the new remaining total. Fractional damage values round up when a prevention effect produces a fraction. A player may play multiple prevention cards, but the chosen play order is rules-significant.

---

## Diablerie

Diablerie occurs when the `DIABLERISE` action resolves against a torpored vampire, or when a `LEAVE_TORPOR` action is blocked and the blocking player's controller chooses to diablerize rather than fight.

Blood Cursed vampires cannot commit diablerie — validated on `DeclareAction` for `DIABLERISE`.

### Diablerie Resolution Sequence

The sequence is atomic — no interruptions between steps:

1. **Blood transfer:** all victim's remaining blood moves to the diablerist via `CardCounterChangedEffect`; blood exceeding the diablerist's capacity is burned (lost to the bank).
2. **Equipment choice:** the diablerist's controller chooses which equipment on the victim to take (if any); `CardAttachedEffect` for each taken item.
3. **Victim burned:** `CardMovedEffect(victim, ASH_HEAP)`; all remaining attached cards and counters on the victim are burned.
4. **Discipline search:** if victim's capacity is strictly greater than diablerist's current capacity, diablerist's controller may search hand, library, and ash heap for one master: Discipline card and put it on the diablerist. Capacity increases by 1; no blood added to fill the new capacity.
5. **Trophy awards:** if the victim is a Red List minion, Trophy awards are resolved before the blood hunt. Controller may search hand/library/ash heap for a master Trophy card to put on the diablerist. Other unawarded Trophies already in play may move to the diablerist at their controller's discretion.
6. **Blood hunt trigger:** `ReferendumState` is opened automatically with `isBloodHunt = true` and `targetRef` = diablerist — see [Referendums](./referendums.md#blood-hunt-auto-trigger). The blood hunt referendum must fully resolve before the AFTER_RESOLUTION window of the triggering action opens.

---

## Torpor

A vampire with unmended damage at the end of Step 5 moves to TORPOR via `CardMovedEffect(victim, TORPOR)`. Equipment and retainers remain attached. The vampire:
- Is not ready: cannot take actions (except `LEAVE_TORPOR`), block, play reactions, or vote.
- Is still controlled: passes through the unlock phase normally (unlocks unless infernal or otherwise restricted).

`LEAVE_TORPOR` action: costs 2 blood from the torpored vampire at resolution. Stealth +1. If blocked, the blocking player may choose to diablerize instead of fight. If blocked and blocking player declines to diablerize: the acting vampire stays in torpor, the action fails (no cost paid).

---

## Minions Not in Current Combat

Only combatants in the active `CombatState` may play combat cards by default. Cards with "usable by a minion not in current combat" in their text are legal for any Methuselah's minion that meets the stated controller, readiness, timing, and target restrictions.
