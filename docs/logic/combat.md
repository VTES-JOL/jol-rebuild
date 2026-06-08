# Combat Mechanics

Defines the full combat system: how combat is initiated, how each round proceeds, how damage and torpor are resolved, and how combat ends.

See [card-play-rules.md](card-play-rules.md) for when combat cards are legal to play within the broader action lifecycle.

---

## Initiating Combat

Combat begins in one of two ways:

| Trigger | Combatants |
|---|---|
| A block attempt succeeds | Acting minion vs blocking minion |
| A rush action resolves unblocked | Acting minion vs the targeted minion |

Both combatants must be ready at the moment combat starts. If either minion is not ready when combat would begin (e.g. sent to torpor by another effect before combat resolves), combat does not occur.

Combat initiated mid-action (e.g. by Hedonism queuing a combat) is resolved immediately and completely before the action lifecycle resumes. Multiple queued combats resolve in FIFO order.

---

## The Combatants

Only two minions fight at a time. "Acting minion" and "blocking/defending minion" are fixed for the duration of combat.

- **Acting minion** — the minion who declared the action (or the rushing minion).
- **Defending minion** — the blocker or the rushed minion.

The acting minion has first sequencing opportunity (ABC priority: A) at every step of every combat round.

### Allies vs vampires

| Minion type | Resource | At 0 resource | Effect of aggravated damage |
|---|---|---|---|
| Vampire | Blood | Goes to torpor | Cannot be mended; burns a wounded vampire |
| Ally | Life counters | Burned (ash heap) | Cannot be mended; burns an ally at 0 life |

Allies do not have a torpor state — they are simply burned when reduced to 0 life.

---

## Combat Round Sequence

Each round of combat follows seven steps in strict order. Both players act within each step before the next begins. The acting minion always has priority (ABC: A) within a step.

### Step 1 — Before Range

Cards with explicit "before range is determined" timing may be played here. Each player passes independently. If neither plays, proceed to Step 2.

### Step 2 — Determine Range

Default range is **close**. Either combatant may play a maneuver card to change range to long, or to return it to close.

**Maneuver rules:**
- A minion cannot play two maneuvers in a row within a single Determine Range step.
- After one minion maneuvers, the other may counter-maneuver, then the first may maneuver again, and so on — alternating until both pass.
- The final declared range stands for this round's strikes.
- Some cards prevent maneuvers entirely (e.g. Immortal Grapple).

**Range effects:**
- Some strikes and combat cards are only legal at a specific range (close or long).
- Dodge is effective at any range.

### Step 3 — Before Strikes

Cards with "before strikes are chosen" timing may be played here. This step is implicitly passed if neither player acts — no declaration is needed.

### Step 4 — Strike

Each combatant **announces** their strike simultaneously (acting minion declares first, then defending minion). Strikes are then **resolved** in the order below.

#### Announcing a strike

A strike declaration names the **type** and, where relevant, the **strength or damage value**:
- Hand strike strength equals the minion's current strength and must be stated explicitly when above 1 (e.g. "hand strike for 2"). Default vampire strength is 1.
- Weapon strikes use the formula defined in the weapon's card text (see Weapon strikes below).
- Special strikes (dodge, Combat Ends, steal blood) are named by type.

#### Strike types

| Strike | Range | Notes |
|---|---|---|
| **Hand strike** | Any | Damage = minion's current strength (vampires default to 1) |
| **Melee weapon strike** | Close (default) | Damage = bearer's strength ± weapon bonus; see Weapon strikes below |
| **Firearm strike** | Long | Fixed ranged (R) damage per weapon card; weapon usually provides an optional maneuver to reach long range |
| **Other ranged weapon strike** | Long | Fixed ranged damage, not classed as a gun; no built-in maneuver unless stated |
| **Fixed-damage weapon strike** | Per weapon | Specific damage value unrelated to strength (e.g. Bomb, Talbot's Chainsaw) |
| **Special weapon strike** | Per weapon | Unique effects (e.g. torpor, combat ends, burn) defined entirely by card text |
| **Dodge** | Any | No damage dealt; protects self and all attached cards from the opposing strike, including Steal Blood |
| **First Strike** | Any | Resolves before normal strikes; if both use first strike they resolve simultaneously |
| **Combat Ends** | Any | Always resolves first — before first strike and normal strikes; ends combat before any other strikes resolve |
| **Steal Blood** | Close | Moves blood/life counters from target to striker; not damage, cannot be prevented, cancelled by a dodge |
| **Additional strikes** | Per card | Extra strikes granted by combat cards; see Additional Strikes below |

#### Weapon strikes

Weapon strikes are divided into categories based on how damage is calculated:

**Melee weapon strikes** — the bearer's current strength is the damage base. Card text specifies any bonus:

| Card text pattern | Damage formula |
|---|---|
| `strength damage` | Exactly the bearer's strength |
| `strength+1 damage` | Bearer's strength + 1 |
| `strength+2 damage` | Bearer's strength + 2 |
| `strength+1 aggravated damage` | Bearer's strength + 1, aggravated |
| `strength aggravated damage` | Bearer's strength, aggravated |

Examples: Sword of Nuln (`strength`), Meat Hook (`strength+1`), Sword of Troile (`strength+2`), Sengir Dagger (`strength aggravated`), Sword of the Archangel (`strength+1 aggravated`).

Bundi is a special case — its card text explicitly states it is both a hand strike and a melee weapon strike, allowing it to interact with both hand-strike and melee-weapon defensive effects.

**Firearm (gun) strikes** — fixed damage independent of strength, always ranged (long range). Card text uses the `R` suffix to denote ranged damage. Most guns provide one optional maneuver per combat to allow the bearer to reach long range. Declared as `weapon: gun` on the card.

| Example | Damage |
|---|---|
| .44 Magnum | 2R (+ optional maneuver) |
| Assault Rifle | 4R (+ optional maneuver) |
| Sniper Rifle | 2R, only at long range |
| Beretta 9mm | 1R (or 2R if bearer has a second Beretta) |

**Other ranged weapon strikes** — fixed ranged damage but not classed as guns; no built-in maneuver unless stated. Typically aggravated.

| Example | Damage |
|---|---|
| Ivory Bow | 1R aggravated |
| Flamethrower | 2R aggravated |
| Waxen Poetica | 2R aggravated (burn after use; restrictions apply) |

**Fixed-damage strikes** — specific damage value, not strength-based and not ranged:

| Example | Damage |
|---|---|
| Talbot's Chainsaw | 3 damage (bearer also takes 3 each unlock phase) |
| Bomb | 5R damage (bearer also takes 5; burn after use) |
| Enhanced Coagulant | 3 unpreventable damage + debuff placed on target |

**Special weapon strikes** — effects that do not follow a damage formula:

| Example | Effect |
|---|---|
| Rowan Ring | Sends opposing vampire to torpor; card transfers to that vampire |
| Flash Grenade | Combat ends; opposing vampire locked and does not unlock normally |

#### Combat cards that become weapons

Some cards have type `Combat` but transform into equipment weapon cards when played during combat. They are played from hand like any combat card, then placed on the minion as an equipment card and function as a weapon for the remainder of combat (and potentially after).

| Card | Played | Becomes | Strike | Duration |
|---|---|---|---|---|
| Weighted Walking Stick | Before range, first round only | Melee weapon equipment with 5 counters | strength+1 damage; burns 1 counter per damage inflicted | Burns when counters reach 0 |
| Zip Gun | Before range is determined | Gun equipment (does not count as a combat card while in play) | 1R damage + optional maneuver each combat; bearer takes 1 damage per combat when striking | Kept as normal equipment after combat ends |

Implementation note: once placed, these cards occupy the equipment zone and obey equipment rules (one Weighted Walking Stick per minion; Zip Gun is kept post-combat and is not discarded). The `CardType` changes from `COMBAT` to `EQUIPMENT` when the card is placed on the minion.

#### Strike resolution order

1. **Combat Ends** — resolves immediately, ends combat before any other strikes land.
2. **First Strike** — resolves before normal strikes; if both combatants use first strike, they resolve simultaneously.
3. **Normal strikes** — all remaining strikes resolve simultaneously.

If the opposing minion is burned or sent to torpor by a first strike, their normal strike does not resolve.

#### Additional strikes

A combat card may grant a minion an additional strike in the same round. Additional strikes resolve simultaneously with the minion's other strikes unless they specify a different timing.

- A minion may gain additional strikes from multiple sources, subject to the **limited** rule: at most one `(limited)` additional-strike source may be used per minion per round. Non-limited sources stack freely.

### Step 5 — Damage Resolution

Strikes resolve and damage is applied. Each point of damage is handled one at a time.

#### Damage types

| Type | Can be mended? | Effect |
|---|---|---|
| **Normal** | Yes — 1 blood per point | Vampire becomes wounded if any damage is not mended |
| **Aggravated** | No | Cannot be mended; see Burning below |
| **Environmental** | Normal rules | No minion source; cannot be attributed to a specific attacker |

When a vampire receives both normal and aggravated damage simultaneously, **normal damage is resolved first**.

#### Wounded state

A vampire is **wounded** if they have taken damage they have not fully mended. Wounded vampires are still ready and may act normally, but are vulnerable to aggravated damage.

#### Aggravated damage and burning

- Aggravated damage cannot be mended.
- If an aggravated damage point is inflicted on an already-**wounded** vampire, the vampire must spend 1 blood to prevent being burned. If they cannot pay, they are burned.
- Aggravated damage inflicted on an **unwounded** vampire is still "taken" but does not immediately burn them — it leaves them wounded (since it cannot be mended).

#### Damage prevention

Prevention cards may be played during Step 5 to reduce incoming damage. Key rules:

- Prevention effects apply in the **order they are played**. Order matters when combining a halving effect with a flat reduction — playing them in the wrong sequence produces a different result.
- Fractional damage values **round up** (e.g. half of 1 damage = 0.5 → rounds up to 1 prevented).
- Steal Blood is **not damage** and cannot be prevented by prevention cards (but is cancelled by a dodge).

#### Mending

After prevention, vampires mend normal damage by spending 1 blood per point of normal damage remaining. Aggravated damage cannot be mended. Any damage that is neither prevented nor mended causes the vampire to enter torpor (vampires) or be burned (allies).

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

When combat ends, the action lifecycle moves to **After Resolution** (or **Action Continuing** if a continue-the-action effect fires). See [card-play-rules.md § After Resolution](card-play-rules.md#after-resolution).

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
- **If unblocked and cost paid:** vampire moves to the ready region and unlocks immediately.
- **If blocked:** no combat. The blocking player's controller may choose to **diablerize** the torpored vampire. If they decline, the acting vampire stays in torpor and the action fails.
- After-resolution effects tied to successfully leaving torpor fire normally.

### Diablerie

Diablerie may occur when a ready vampire has a torpored vampire at their mercy (either after combat drives a vampire to torpor, or by blocking a Leave Torpor action). The diablerist drinks the blood of the torpored vampire:

- The diablerist may gain a discipline card from the victim (per card text and game rules).
- The victim is removed from the game (burned).
- The diablerist may gain or lose pool depending on other card effects.
- Diablerie has social consequences (Anathema, Hunt the Witch rules) tracked separately.

---

## Minions Not in the Current Combat

Some combat cards specify "usable by a minion not in the current combat." Any ready minion controlled by any Methuselah may play such a card, subject to normal impulse/sequencing rules for who holds priority.

---

## Environmental Damage

Environmental damage has no minion source. It cannot be attributed to a specific attacker. Normal prevention cards still apply unless the card text specifies otherwise. Environmental damage is neither normal nor aggravated by default unless the card specifies a type.

---

## Implementation Status

Combat is not yet formally enforced. The game engine tracks `pendingCombat` state but does not step through the seven-round sequence. See [vtes-mechanics-gaps.md](vtes-mechanics-gaps.md) for the full gap list.
