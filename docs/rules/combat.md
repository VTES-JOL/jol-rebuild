# Combat Mechanics

Defines the full combat system: how combat is initiated, how each round proceeds, how damage and torpor are resolved, and how combat ends.

See [Actions](./actions.md) for the broader action lifecycle and [Card Timing and Card Types](./card-play.md) for generic card-play timing.

---

## Initiating Combat

Combat begins in one of two ways:

| Trigger                                  | Combatants                           |
|------------------------------------------|--------------------------------------|
| A block attempt succeeds                 | Acting minion vs blocking minion     |
| A enter combat action resolves unblocked | Acting minion vs the targeted minion |

Both combatants must be ready at the moment combat starts. If either minion is not ready when combat would begin (e.g. sent to torpor by another effect before combat resolves), combat does not occur.

Combat initiated mid-action (e.g. by Hedonism queuing a combat) is resolved immediately and completely before the action lifecycle resumes. Multiple queued combats resolve in FIFO order.

---

## The Combatants

Only two minions fight at a time. "Acting minion" and "blocking/defending minion" are fixed for the duration of combat.

- **Acting minion** — the minion who declared the action (or the rushing minion).
- **Defending minion** — the blocker or the rushed minion.

The acting minion has first sequencing opportunity (ABC priority: A) at every step of every combat round.

### Allies vs vampires

| Minion type | Resource      | At 0 resource                                | Effect of aggravated damage                              |
|-------------|---------------|----------------------------------------------|----------------------------------------------------------|
| Vampire     | Blood         | Remains ready; cannot mend damage with blood | Cannot be mended; can burn a wounded vampire             |
| Ally        | Life counters | Burned (ash heap)                            | Treated as normal damage unless card text says otherwise |

Vampires do not go to torpor just because they have 0 blood. They go to torpor when they have unmended damage at the end of damage resolution or when an effect explicitly sends them there.

Allies do not have a torpor state — they are simply burned when reduced to 0 life. Most allies treat aggravated damage as normal damage: remove life counters normally, and burn the ally only if its life reaches 0. Card text can create exceptions.

---

## Combat Round Sequence

Each round of combat follows seven steps in strict order. Both players act within each step before the next begins. The acting minion always has priority (ABC: A) within a step.

### Step 1 — Before Range

Cards with explicit "before range is determined" timing may be played here. Each player passes independently. If neither plays, proceed to Step 2.

### Step 2 — Determine Range

Default range is **close**. Either combatant may play a maneuver card to change range to long, or to return it to close.

**Maneuver rules:**
- Either minion may maneuver to change the range; the acting minion gets the first opportunity.
- Maneuvers offset the opposing minion's last maneuver: a maneuver can move the range to long, or move it back to close if the opposing minion last maneuvered to long.
- A minion cannot play two maneuvers in a row. The same minion cannot maneuver to long and then maneuver back to close unless the opposing minion changed the range in between.
- A minion may maneuver again in the same round after the opposing minion maneuvers. For example: A maneuvers to long, B maneuvers back to close, then A may maneuver to long again.
- Only one weapon or strike card may be used to maneuver by a minion in a round.
- If a minion uses a maneuver granted by a card that also grants a strike, that minion's first strike that turn must be the strike granted by that same card. This restriction applies only when the granted maneuver is used; for example, a minion with a .44 Magnum is not required to strike with the gun unless they use the .44 Magnum's maneuver.
- The final declared range stands for this round's strikes.
- Some cards prevent maneuvers entirely (e.g. Immortal Grapple).

**Range effects:**
- Some strikes and combat cards are only legal at a specific range (close or long).
- Dodge is effective at any range.

### Step 3 — Before Strikes

Cards and effects with "before strikes are chosen" timing are played here, after range is determined and before the initial strike choices for this round. The acting minion has first opportunity, then the opposing minion; if either player plays an effect, priority returns to the acting minion before the window can close.

This is a round-level timing window:
- Range-dependent pre-strike effects must be legal at the final range for the round (for example, "only usable at close range before strikes are chosen" is playable only if range is close).
- Using a maneuver from a strike card or weapon during Step 2 can require that minion to choose the strike from the same card as their initial strike, but it does not skip this Step 3 window.
- Once both players pass, initial strikes are chosen in Step 4. "Before strikes are chosen" effects can no longer be played for that initial strike pair.
- Additional strikes later in the same round repeat strike announcement and strike resolution; they do not reopen the Step 3 "before strikes are chosen" window unless card text explicitly creates a new timing permission.

### Step 4 — Strike

Each combatant announces their strike: the acting minion announces first, then the defending minion. Strikes are then resolved in the order below. If both strikes are in the same resolution class, their effects are applied simultaneously.

#### Announcing a strike

A strike declaration names the **type** and, where relevant, the **strength or damage value**:
- Hand strike strength equals the minion's current strength and must be stated explicitly when above 1 (e.g. "hand strike for 2"). Default strength for all minions is 1 unless card text says otherwise.
- Weapon strikes use the formula defined in the weapon's card text.
- Special strikes (dodge, Combat Ends, steal blood) are named by type.

#### Strike range defaults

Most strikes are effective only at close range. A strike is effective at either close or long range only if it is identified as ranged, does `R` damage, is a defensive strike such as dodge or Combat Ends, or card text otherwise says it is usable at long range.

`R` means ranged damage. A ranged strike or a strike that does `R` damage can be used at close range unless card text specifically prohibits close-range use. A strike that does fixed damage without `R`, without "ranged" text, and without explicit long-range permission defaults to close-range use only.

#### Strike types

| Strike                         | Range            | Notes                                                                                                                                                                                                |
|--------------------------------|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Hand strike**                | Close by default | Damage = minion's current strength; all minions default to strength 1 unless card text says otherwise. A strike is only effective at close range unless card text or the strike type says otherwise. |
| **Melee weapon strike**        | Close (default)  | Damage = bearer's strength ± weapon bonus; see Weapon strikes below                                                                                                                                  |
| **Firearm strike**             | Close or long    | Fixed ranged (R) damage per weapon card; usable at close range unless card text prohibits it. Weapons usually provide an optional maneuver to reach long range                                       |
| **Other ranged weapon strike** | Close or long    | Fixed ranged damage, not classed as a gun; usable at close range unless card text prohibits it. No built-in maneuver unless stated                                                                   |
| **Fixed-damage weapon strike** | Per weapon       | Specific damage value unrelated to strength. Close-only unless the strike does `R` damage, is identified as ranged, or card text grants long-range use                                               |
| **Special weapon strike**      | Per weapon       | Unique effects (e.g. torpor, combat ends, burn) defined entirely by card text                                                                                                                        |
| **Dodge**                      | Any              | No damage dealt; cancels the opposing strike's effect on the dodging minion and non-retainer cards on that minion, including Steal Blood. Retainers are not protected.                               |
| **First Strike**               | Any              | Resolves before normal strikes; if both use first strike they resolve simultaneously                                                                                                                 |
| **Combat Ends**                | Any              | Always resolves first — before first strike and normal strikes; ends combat before any other strikes resolve                                                                                         |
| **Steal Blood**                | Close            | Moves blood/life counters from target to striker; not damage, cannot be prevented, cancelled by a dodge                                                                                              |
| **Additional strikes**         | Per card         | Extra strikes granted by combat cards; see Additional Strikes below                                                                                                                                  |

#### Weapon strikes

Weapon strikes are divided into categories based on how damage is calculated:

**Melee weapon strikes** — the bearer's current strength is the damage base. Card text specifies any bonus:

| Card text pattern              | Damage formula                    |
|--------------------------------|-----------------------------------|
| `strength damage`              | Exactly the bearer's strength     |
| `strength+1 damage`            | Bearer's strength + 1             |
| `strength+2 damage`            | Bearer's strength + 2             |
| `strength+1 aggravated damage` | Bearer's strength + 1, aggravated |
| `strength aggravated damage`   | Bearer's strength, aggravated     |

Examples: Sword of Nuln (`strength`), Meat Hook (`strength+1`), Sword of Troile (`strength+2`), Sengir Dagger (`strength aggravated`), Sword of the Archangel (`strength+1 aggravated`).

Bundi is a special case — its card text explicitly states it is both a hand strike and a melee weapon strike, allowing it to interact with both hand-strike and melee-weapon defensive effects.

**Firearm (gun) strikes** — fixed damage independent of strength. Card text uses the `R` suffix to denote ranged damage; it does not by itself make the strike only usable at long range. Most guns provide one optional maneuver per combat to allow the bearer to reach long range. Declared as `weapon: gun` on the card.

| Example       | Damage                                    |
|---------------|-------------------------------------------|
| .44 Magnum    | 2R (+ optional maneuver)                  |
| Assault Rifle | 4R (+ optional maneuver)                  |
| Sniper Rifle  | 2R, only at long range                    |
| Beretta 9mm   | 1R (or 2R if bearer has a second Beretta) |

**Other ranged weapon strikes** — fixed ranged damage but not classed as guns; usable at close range unless card text prohibits it. No built-in maneuver unless stated. Typically aggravated.

| Example       | Damage                                             |
|---------------|----------------------------------------------------|
| Ivory Bow     | 1R aggravated                                      |
| Flamethrower  | 2R aggravated                                      |
| Waxen Poetica | 2R aggravated (burn after use; restrictions apply) |

**Fixed-damage strikes** — specific damage value, not strength-based. These strikes default to close range unless the strike does `R` damage, is identified as ranged, or card text grants long-range use:

| Example            | Range         | Damage                                           |
|--------------------|---------------|--------------------------------------------------|
| Talbot's Chainsaw  | Close only    | 3 damage (bearer also takes 3 each unlock phase) |
| Bomb               | Close or long | 5R damage (bearer also takes 5; burn after use)  |
| Enhanced Coagulant | Close only    | 3 unpreventable damage + debuff placed on target |

**Special weapon strikes** — effects that do not follow a damage formula:

| Example       | Effect                                                            |
|---------------|-------------------------------------------------------------------|
| Rowan Ring    | Sends opposing vampire to torpor; card transfers to that vampire  |
| Flash Grenade | Combat ends; opposing vampire locked and does not unlock normally |

#### Combat cards that become weapons

Some cards have type `Combat` but transform into equipment weapon cards when played during combat. They are played from hand like any combat card, then placed on the minion as an equipment card. Once placed, they persist as equipment until they are burned or otherwise leave play by normal equipment rules or their own card text.

| Card                   | Played                         | Becomes                                                       | Strike                                                                                    | Persistence                                |
|------------------------|--------------------------------|---------------------------------------------------------------|-------------------------------------------------------------------------------------------|--------------------------------------------|
| Weighted Walking Stick | Before range, first round only | Melee weapon equipment with 5 counters                        | strength+1 damage; burns 1 counter per damage inflicted                                   | Persists as equipment; burns at 0 counters |
| Zip Gun                | Before range is determined     | Gun equipment (does not count as a combat card while in play) | 1R damage + optional maneuver each combat; bearer takes 1 damage per combat when striking | Persists as normal equipment after combat  |

Once placed, these cards occupy the equipment zone and obey equipment rules. The card type changes from `COMBAT` to `EQUIPMENT` when the card is placed on the minion; it does not revert when combat ends.

#### Strike resolution order

1. **Combat Ends** — resolves immediately, ends combat before any other strikes land.
2. **First Strike** — resolves before normal strikes; if both combatants use first strike, they resolve simultaneously.
3. **Normal strikes** — all remaining strikes resolve simultaneously.

If the opposing minion is burned or sent to torpor by a first strike, their normal strike does not resolve.

#### Additional strikes

After the initial strikes and damage prevention/resolution, combatants have the option to gain additional strikes for the same round. Additional strikes do **not** resolve simultaneously with the initial strikes.

- Additional strikes are resolved by repeating strike announcement and strike resolution for each additional strike.
- Additional strikes use the same range as the initial strikes for that round.
- Additional strikes do not repeat Before Range, Determine Range, or Before Strikes for the round.
- A minion may gain additional strikes from multiple sources, subject to the **limited** rule: at most one `(limited)` additional-strike source may be used per minion per round. Non-limited sources stack freely.

### Step 5 — Damage Resolution

Strikes resolve and damage is applied. Each point of damage is handled one at a time.

#### Damage types

| Type              | Can be mended?                                                         | Effect                                                                         |
|-------------------|------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| **Normal**        | Yes — vampires spend 1 blood per point                                 | Vampire becomes wounded if any damage is not mended; allies lose life counters |
| **Aggravated**    | No for vampires; normal ally life loss unless card text says otherwise | Cannot be mended by vampires; see Burning below                                |
| **Environmental** | Normal rules                                                           | No minion source; cannot be attributed to a specific attacker                  |

When a vampire receives both normal and aggravated damage simultaneously, **normal damage is handled first**, but this applies only after damage prevention. Prevention effects can be used against aggravated damage before normal damage is handled.

#### Wounded state

A vampire is **wounded** if they have received damage they have not mended, are in torpor, or are on the way to torpor. Unmended damage is checked during damage resolution; after damage resolution, a vampire with unmended damage is placed in torpor unless the damage caused destruction instead. A vampire is no longer wounded after successfully leaving torpor or being rescued from torpor.

#### Aggravated damage and burning

- Aggravated damage to vampires cannot be mended, so it remains unmended unless it is prevented.
- Normal damage is handled before aggravated damage, after prevention effects have been applied.
- The first point of unprevented aggravated damage handled by an unwounded vampire makes that vampire wounded; it does not cost blood to mend.
- Each point of unprevented aggravated damage handled while the vampire is wounded requires that vampire to burn 1 blood to prevent destruction. If the vampire cannot burn enough blood, the vampire is burned without going to torpor.
- If the vampire has unmended damage but was not burned by aggravated damage, the vampire is placed in torpor after all damage is handled.
- Most allies treat aggravated damage as normal damage, losing life counters instead of using the vampire wounded/torpor/destruction rules. If an ally's card text makes aggravated damage special for that ally, follow that card text.

#### Damage prevention

Prevention cards may be played during Step 5 to reduce incoming damage. Key rules:

- Prevention effects apply in the **order they are played**. Order matters when combining a halving effect with a flat reduction — playing them in the wrong sequence produces a different result.
- Fractional damage values **round up** (e.g. half of 1 damage = 0.5 → rounds up to 1 prevented).
- Steal Blood is **not damage** and cannot be prevented by prevention cards (but is cancelled by a dodge).

#### Mending

After prevention, vampires mend normal damage by spending 1 blood per point of normal damage remaining. Aggravated damage cannot be mended by vampires. Allies and retainers lose life counters from damage; for most allies, aggravated damage removes life counters the same way normal damage does. After damage resolution, a vampire with unmended damage is placed in torpor unless aggravated damage burned it; an ally or retainer with zero life counters is burned.

### Step 6 — Press

The **default at the end of every round is that combat ends**. No card is needed to end combat.

- A player may play a **press to continue** card to force another round.
- The opposing player may respond with a **press to end** card to cancel the press to continue.
- A minion cannot play two presses in a row.
- If at least one uncontested press to continue remains after all responses, a new round of combat begins from Step 1.
- If no press to continue is played (or all are cancelled), combat ends.

### Step 7 — End of Round

"End of round" cards and effects fire here, even if combat ended prematurely earlier in the round (e.g. via Combat Ends strike).

---

## Ending Combat

Combat ends when:

- The press step concludes with no uncontested press to continue (normal end).
- A Combat Ends strike resolves.
- One or both combatants are no longer ready (burned or in torpor).

### End-of-combat timing

The official combat sequence has an **End of Round** step, not a separately numbered End of Combat step. That step is still reached when combat ends prematurely.

Card text and rulings also create timing around combat ending:
- Effects usable **when combat is about to end** or **when combat would end** are used before combat actually ends and can replace or interrupt the end of combat (for example, Psyche! or Telepathic Tracking).
- Effects that happen **before combat ends** resolve before the combat-ending point.
- Effects that happen **at the end of combat** or **after combat ends** resolve at the combat-ending point or immediately after it, as their card text states.

Combat cards cannot be played after combat unless their card text explicitly permits that timing. "End of round" effects such as Taste of Vitae and Disarm are played in Step 7, after presses are handled, including when combat ended prematurely.

After all applicable end-of-round, end-of-combat, and after-combat effects have resolved, the action lifecycle moves to **After Resolution** (or **Action Continuing** if a continue-the-action effect fires). See [Actions § After Resolution](./actions.md#after-resolution).

---

## Torpor

A vampire who cannot mend all their wounds at the end of damage resolution goes to **torpor**:

- Placed in the torpor area adjacent to their controller's uncontrolled region.
- Equipment and retainers remain attached.
- Is **not ready**: cannot take actions (except Leave Torpor), block, play reactions, or vote.
- Still controlled; still passes through the unlock phase normally (unlocks unless infernal or otherwise restricted).

### Leave Torpor action

- **Cost:** 2 blood, paid by the torpored vampire at resolution.
- **Stealth:** +1 (standard action default).
- **Blockable:** yes.
- **If unblocked and cost paid:** vampire moves to the ready region and is no longer wounded.
- **If blocked:** no combat. If the blocker is a vampire, the blocking player's controller may choose to **diablerize** the torpored vampire. If they decline or the blocker is an ally, the acting vampire stays in torpor and the action fails.

### Rescue action

- **Actor:** any ready vampire.
- **Cost:** 2 blood, paid by the acting vampire, the rescued vampire, or split between them.
- **Target:** a vampire in torpor.
- **Stealth:** +1 if the acting vampire and target have the same controller; +0 if they have different controllers.
- **If unblocked and cost paid:** target vampire moves to the ready region and is no longer wounded. The rescued vampire does not lock or unlock because of being rescued.
- **If blocked:** acting vampire and blocking minion enter combat normally.

### Diablerie

Diablerie may occur when a ready vampire has a torpored vampire at their mercy. The diablerist drinks the blood of the torpored vampire:

1. The victim's remaining blood transfers to the diablerist; excess over the diablerist's capacity is burned.
2. The diablerist may take any equipment on the victim.
3. The victim is burned and sent to their owner's ash heap. Any cards and counters on the victim are burned, except equipment taken by the diablerist.
4. If the victim's capacity is strictly greater than the diablerist's capacity, the diablerist's controller may search their hand, library, and/or ash heap for a master: Discipline card to put on the diablerist, then reshuffle or draw back to hand size as necessary. This can increase the diablerist's capacity by 1, but does not add blood to fill that new capacity.
5. If the victim was a Red List minion burned in combat or as a directed action, including diablerie, Trophy awards are resolved now before the blood hunt. See [Card Keywords § Minion Traits](./card-keywords.md#minion-traits) for Red List and Trophy rules. The diablerist's controller may search their hand, library, and/or ash heap for a master Trophy card to put on the diablerist, then reshuffle or draw back to hand size as necessary. Other unawarded Trophies in play may also be moved to the diablerist at each Trophy controller's discretion.
6. A blood hunt referendum is automatically called. See [Referendums § Blood Hunt Referendum](./referendums.md#blood-hunt-referendum).

Diablerie is resolved as a single unit. No effects can interrupt the middle of the diablerie sequence; effects are used before or after the diablerie as card text permits.

Trophies cannot be awarded for burning a Red List minion you control, because that diablerie is not a directed action against another Methuselah's minion.

If Trophy: Diablerie is awarded during this diablerie, it is in place before the blood hunt referendum and protects the diablerist from that referendum. It is burned at the end of the action.

A Blood Cursed vampire cannot commit diablerie.

---

## Minions Not in the Current Combat

The default rule is that combat cards are played only by minions involved in the current combat. Some combat cards explicitly override this with text such as "usable by a minion not in the current combat"; when a card has such text, follow that card's controller, readiness, timing, and target restrictions.

---

## Environmental Damage

Environmental damage has no minion source and cannot be attributed to a specific attacker. It is still resolved through the normal/aggravated damage framework: unless card text says the damage is aggravated or otherwise modifies prevention/resolution, treat it as normal damage.

---

## Source Notes

- [VEKN Rulebook § Combat](https://www.vekn.net/rulebook) defines combat initiation after blocks and enter-combat actions, the combat round sequence, range, maneuvers, strike declaration, damage prevention, presses, and end-of-round timing.
- [VEKN Rulebook § Strikes](https://www.vekn.net/rulebook) defines hand strikes, weapon strikes, dodge, Combat Ends, first strike, steal blood, strike resolution order, and additional strikes.
- [VEKN Rulebook § Damage Resolution](https://www.vekn.net/rulebook) defines normal and aggravated damage, mending, wounded vampires, torpor, burning, and ally life loss.
- [VEKN Rulebook § Torpor and Diablerie](https://www.vekn.net/rulebook) defines torpor state, leaving torpor, diablerie sequence, Discipline gains, and blood hunt calls.
- [VEKN Detailed Play Summary](https://www.vekn.net/detailed-play-summary) is used for combat timing windows, ABC sequencing, queued combat resolution, end-of-round handling when combat ends early, and Red List Trophy timing before blood hunt.
- Weapon-category examples and combat cards that become equipment are based on current card text; verify unusual weapons and transformed card types against [VEKN Card Lists](https://www.vekn.net/card-lists) and the [VTES Rulings database](https://github.com/vtes-biased/vtes-rulings/blob/main/README.md).
