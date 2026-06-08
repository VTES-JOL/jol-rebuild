# VTES Mechanics Gap Analysis

Cross-reference of the [VEKN Rulebook](https://www.vekn.net/rulebook) and [Detailed Play Summary](https://www.vekn.net/detailed-play-summary) against the current JOL implementation. Source of truth for prioritising new commands and UI features.

---

## Already Implemented

| Mechanic                                                                                                                            | Implementation                                                                                    |
|-------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Five-phase turn cycle (UNLOCK → MASTER → MINION → INFLUENCE → DISCARD)                                                              | `AdvancePhase`, `NextTurn`                                                                        |
| 30-pool start, pool adjustment                                                                                                      | `SetPool`, `TransferBlood`                                                                        |
| Blood counters on cards                                                                                                             | `AddCounter` / `RemoveCounter`                                                                    |
| All nine region types (READY, UNCONTROLLED, TORPOR, HAND, LIBRARY, CRYPT, ASH_HEAP, RESEARCH, REMOVED_FROM_GAME)                    | `RegionType` enum, visibility rules                                                               |
| Influence system — counters on UNCONTROLLED, promote to READY                                                                       | `InfluenceCard`, `MoveToCrypt`, `TransferBlood`                                                   |
| Influence transfer budget (1/2/3/4 per turn, capped at 4) enforced; extraction costs 2T/blood                                       | `GameData.transfersRemaining`, `TransferBlood` guard, `AdvancePhase` budget set, `NextTurn` reset |
| `InfluenceCard` restricted to current player, INFLUENCE phase only, requires counters ≥ capacity > 0                                | `GameCommandService.handleInfluenceCard`                                                          |
| Torpor — enter and leave                                                                                                            | `MoveToTorpor`, `RescueFromTorpor`, `BurnMinion`                                                  |
| Edge tracking                                                                                                                       | `GainEdge`                                                                                        |
| Ousting and victory points                                                                                                          | `OustPlayer`, `victoryPoints` field                                                               |
| Card lock / unlock                                                                                                                  | `LockCard`, `UnlockCard`, `UnlockAll`                                                             |
| Unique card contesting                                                                                                              | `ContestCard`, `ClearContestCard`                                                                 |
| Vampire title assignment                                                                                                            | `SetTitle`                                                                                        |
| All card types (VAMPIRE, IMBUED, MASTER, ACTION, MODIFIER, REACTION, COMBAT, ALLY, RETAINER, POLITICAL, EQUIPMENT, EVENT, LOCATION) | `CardType` enum                                                                                   |
| Attached cards (retainers, equipment)                                                                                               | `AttachCard`                                                                                      |
| Draw / discard / shuffle                                                                                                            | `DrawCard`, `DiscardCard`, `ShuffleLibrary`, `ShuffleCrypt`                                       |
| General card movement between any regions                                                                                           | `MoveCard`, `PlayCard`                                                                            |
| Order-of-play reversal                                                                                                              | `ReverseOrder`                                                                                    |
| Crypt group deck-building restrictions (single or two consecutive)                                                                  | `DeckValidatorService`                                                                            |
| Sect and discipline fields on cards                                                                                                 | `CardState` fields                                                                                |
| Predator / prey circle derivation                                                                                                   | `GameInitService`                                                                                 |

---

## Gaps by Category

### 1. Voting & Referendums

The entire referendum engine is absent. This covers blood hunt (mandatory after diablerie), political action cards, and any card that calls a vote.

**Missing mechanics:**

| Mechanic                                                                                                                         | Rulebook reference              |
|----------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| Declaring a referendum (political action or blood hunt)                                                                          | Minion Phase — Political Action |
| Vote sources: titled vampires (Primogen/Bishop = 1, Prince/Archbishop/Baron = 2, Justicar/Cardinal = 3, Inner Circle/Regent = 4) | Vampire Sects                   |
| Vote sources: political action card (1 vote per Methuselah)                                                                      | Politics & Referendums          |
| Vote sources: Edge (burn for 1 vote)                                                                                             | The Edge                        |
| Priscus block — 3 collective votes resolved by a sub-referendum among all Prisci controllers                                     | Sabbat Titles                   |
| Pass / fail resolution (votes for > votes against = pass)                                                                        | Politics & Referendums          |
| Automatic blood hunt after diablerie                                                                                             | Diablerie                       |

**Proposed commands:**

| Command             | Fields                                                                                                          | Description                                                                                      |
|---------------------|-----------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| `CallReferendum`    | `type` (BLOOD_HUNT \| POLITICAL), `targetRef?` (victim for blood hunt), `cardRef?` (political action card used) | Declare a referendum; locks the acting minion                                                    |
| `CastVote`          | `playerName`, `forVotes`, `againstVotes`                                                                        | Commit a player's votes for or against the open referendum                                       |
| `ResolveReferendum` | —                                                                                                               | Tally votes, apply pass/fail effect, close referendum                                            |
| `BurnEdgeForVote`   | `playerName`                                                                                                    | Burn the edge to contribute 1 vote (transfers edge away and increments that player's vote total) |

A `ReferendumState` object should be added to `GameData` containing: `type`, `callerName`, `targetRef`, `votesFor`, `votesAgainst`, `playerVotes` (map), `status` (OPEN / RESOLVED).

---

### 2. Formal Action Declaration & Blocking

VTES action resolution is a structured handshake: declare → block window → resolve or fight. JOL currently has no first-class representation of an in-progress action; players manage this entirely through chat.

**Missing mechanics:**

| Mechanic                                                                                                                                                                | Rulebook reference               |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------|
| Declaring an action (locks acting minion, opens a block window)                                                                                                         | Minion Phase — Action Resolution |
| Block attempts by ready minions of other players                                                                                                                        | Stealth & Intercept              |
| Stealth vs. intercept comparison determining whether a block succeeds                                                                                                   | Stealth & Intercept              |
| Out-of-turn reaction cards (played during another player's minion phase)                                                                                                | Reaction Cards                   |
| Acting minion goes to torpor instead of combat if it was acting from torpor                                                                                             | Combat — Torpor exception        |
| Directed `(D)` action blocking — only the target Methuselah's minions may attempt to block unless card text explicitly allows another Methuselah to attempt             | Minion Phase — Directed Actions  |
| Stealth/intercept accumulation — bonuses from action modifiers and reactions stack numerically during the impulse window; comparison is resolved once the window closes | Stealth & Intercept              |

**Stealth / intercept notes:**

- Base stealth is 0; base intercept is 0 for most minions (some have printed intercept values).
- Stealth bonuses are played by the acting player during the action impulse window (as action modifiers).
- Intercept bonuses are played by blocking players (as reactions or vampire abilities).
- A block succeeds if the blocker's total intercept ≥ the acting minion's total stealth at the moment the blocker is declared.
- `"Optional intercept"` on a vampire means the vampire may use that source or choose not to; it is not automatic.
- Stealth and intercept totals are ephemeral — they reset to 0 after the action resolves or is blocked.

**Proposed commands:**

| Command         | Fields                                                                                                                                                                               | Description                                                               |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `DeclareAction` | `actorRef`, `actionType` (BLEED \| HUNT \| EQUIP \| EMPLOY_RETAINER \| RECRUIT_ALLY \| POLITICAL \| LEAVE_TORPOR \| RESCUE \| DIABLERISE \| CUSTOM), `targetPlayerName?`, `cardRef?` | Open an action; locks the actor; sets `pendingAction` on game state       |
| `AttemptBlock`  | `blockerRef`                                                                                                                                                                         | Attempt to block the pending action with a ready minion                   |
| `ResolveAction` | —                                                                                                                                                                                    | Confirm the action proceeds unblocked; pays costs, applies effects        |
| `AbortAction`   | —                                                                                                                                                                                    | Cancel the declared action without effect (stealth/intercept negotiation) |

A `PendingActionState` on `GameData` should hold: `actorRef`, `actionType`, `targetPlayerName`, `stealth`, `intercept`, `blockerRef` (null if unblocked), `status` (DECLARED / BLOCKED / RESOLVED).

---

### 3. Combat System

Combat has no formal structure in JOL. Players simulate it through counter adjustments and torpor/burn commands. The seven-step round is entirely manual.

**Missing mechanics:**

| Mechanic                                                                                                            | Rulebook reference    |
|---------------------------------------------------------------------------------------------------------------------|-----------------------|
| Close vs. long range; default is close                                                                              | Combat — Range        |
| Maneuvers to change range                                                                                           | Combat — Maneuvers    |
| Strike declaration and resolution order (combat ends, first strike, normal strikes; simultaneous only within the same strike class) | Combat — Strikes      |
| First-strike resolution before normal strikes                                                                       | Combat — First Strike |
| Normal damage (burns blood to mend) vs. aggravated damage (cannot mend, forces torpor)                              | Combat — Damage       |
| Press to continue or end combat                                                                                     | Combat — Press        |
| Excess aggravated damage on a torpored vampire causes destruction                                                   | Combat — Damage       |

**Proposed commands:**

| Command          | Fields                                                                                                                                         | Description                                                    |
|------------------|------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| `EnterCombat`    | `attackerRef`, `defenderRef`                                                                                                                   | Begin a combat between two ready minions; sets `pendingCombat` |
| `Maneuver`       | `playerName`, `direction` (CLOSE \| LONG)                                                                                                      | Adjust range during the range-determination step               |
| `DeclareStrike`  | `playerName`, `strikeType` (HAND \| DODGE \| COMBAT_ENDS \| STEAL_BLOOD \| FIRST_STRIKE \| DESTROY_EQUIPMENT \| STEAL_EQUIPMENT), `targetRef?` | Commit a strike for this round                                 |
| `ResolveStrikes` | —                                                                                                                                              | Resolve declared strikes in official strike-class order and apply damage/effects |
| `ApplyDamage`    | `targetRef`, `amount`, `aggravated`                                                                                                            | Explicit damage step (for card effects mid-combat)             |
| `Press`          | `playerName`, `decision` (CONTINUE \| END)                                                                                                     | Press decision at end of a combat round                        |
| `EndCombat`      | —                                                                                                                                              | Close the combat; clean up `pendingCombat` state               |

A `PendingCombatState` on `GameData` should hold: `attackerRef`, `defenderRef`, `range` (CLOSE/LONG), `round`, `attackerStrike`, `defenderStrike`, `status`.

**Combat queuing (FIFO):** Combat resolves inside the Resolution state and must fully complete before the action lifecycle continues. If a card effect generates a new combat while `pendingCombat` is already active (e.g. a press that redirects to a different opponent, or an effect mid-combat), the new combat is **enqueued** — it does not nest or interrupt the current one. Add a `combatQueue: List<CombatPair>` to `GameData`; `EnterCombat` appends to the queue when `pendingCombat` is set, and `EndCombat` dequeues the next combat if one is waiting.

---

### 4. Influence Phase — Transfer Tracking

**Implemented:**

| Mechanic                                                                                          | Implementation                                                                                     |
|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Transfer budget: 1 (turn 1.x, seat 1), 2 (seat 2), 3 (seat 3), 4 (seat 4+); always 4 from round 2 | `GameData.transfersRemaining` set by `AdvancePhase` on INFLUENCE entry via `computeTransferBudget` |
| Pool → UNCONTROLLED costs 1 transfer/blood; UNCONTROLLED → pool costs 2 transfers/blood           | `TransferBlood` guard in `GameCommandService`                                                      |
| Transfers restricted to current player during INFLUENCE phase                                     | `TransferBlood` and `InfluenceCard` guards                                                         |
| Budget shown as `nT` badge in phase tracker UI                                                    | `PhaseTracker` in `GameStatusBar`                                                                  |
| Budget reset to 0 on `NextTurn`                                                                   | `handleNextTurn`                                                                                   |

**Previously missing (now done):**

| Mechanic                                                                                                       | Implementation                                                                                                                  |
|----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| ~~4 transfers + 1 pool to move a card from crypt to UNCONTROLLED~~                                             | `DrawCryptToUncontrolled` — enforces INFLUENCE phase, 4T + 1 pool cost                                                          |
| ~~Advanced vampire merge: base + advanced version of the same vampire merge into one~~                         | `MergeAdvanced` — validates same name + one advanced, burns incoming counters/attachments, attaches incoming card to READY card |

---

### 5. Unlock Phase — Automatic Effects

The unlock phase has several automatic cost / benefit rules that currently require manual execution.

| Mechanic                                                                            | Rulebook reference |
|-------------------------------------------------------------------------------------|--------------------|
| Edge holder may gain +1 pool during unlock phase                                    | Unlock Phase       |
| Contested unique cards cost 1 pool per unlock phase to maintain (auto-pay or yield) | Contested Cards    |
| Contested titles cost 1 blood per unlock phase                                      | Contested Titles   |

**Proposed command:**

| Command           | Fields       | Description                                                                    |
|-------------------|--------------|--------------------------------------------------------------------------------|
| `YieldContest`    | `ref`        | Yield a contested card (burns it to ash heap; saves the 1-pool/1-blood upkeep) |
| `CollectEdgePool` | `playerName` | Claim the +1 pool bonus from holding the edge during unlock                    |

These could also be automated server-side as part of `AdvancePhase` when leaving DISCARD → UNLOCK, presenting prompts to the client.

---

### 6. Master Phase — Action Accounting

| Mechanic                                                                                              | Rulebook reference |
|-------------------------------------------------------------------------------------------------------|--------------------|
| Playing a Trifle master card grants one additional master phase action                                | Master Phase       |
| Playing an out-of-turn master card uses the playing Methuselah's next master phase action; no Methuselah may play more than one out-of-turn master between two of their turns | Master Phase       |

**Proposed additions:**

- Add `masterActionsRemaining` to `GameData` (default 1 at start of MASTER phase).
- Add `ExtraMasterAction` command (dispatched when a trifle is played).
- Add out-of-turn master accounting to mark the playing Methuselah's next master phase action as already used.

---

### 7. Withdrawal

| Mechanic                                                                                                                | Rulebook reference |
|-------------------------------------------------------------------------------------------------------------------------|--------------------|
| Announce withdrawal during unlock phase                                                                                 | Withdrawal         |
| Survive to next unlock phase without: transferring pool, playing cards, using retainers, blocking, or initiating combat | Withdrawal         |
| Gain 1 VP on confirmation                                                                                               | Withdrawal         |

**Proposed commands:**

| Command              | Fields       | Description                                                            |
|----------------------|--------------|------------------------------------------------------------------------|
| `AnnounceWithdrawal` | `playerName` | Flags player as attempting withdrawal; adds `withdrawalPending` state  |
| `ConfirmWithdrawal`  | `playerName` | Confirms survival; awards 1 VP and marks player withdrawn (not ousted) |
| `CancelWithdrawal`   | `playerName` | Cancel withdrawal flag (player took a prohibited action)               |

---

### 8. Diablerie — Full Resolution

`BurnMinion` handles the physical removal, but the full diablerie resolution is not automated.

| Mechanic                                                                           | Rulebook reference |
|------------------------------------------------------------------------------------|--------------------|
| Victim's blood transfers to the diablerist (up to diablerist's capacity)           | Diablerie          |
| Diablerist may take victim's equipment                                             | Diablerie          |
| If victim is older (higher capacity), diablerist gains one of victim's disciplines | Diablerie          |
| Automatic blood hunt referendum is called                                          | Diablerie          |

**Proposed command:**

| Command      | Fields                       | Description                                                                                                                               |
|--------------|------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `Diablerise` | `diableristRef`, `victimRef` | Full resolution: transfer blood, optionally transfer equipment, optionally gain discipline, then call blood hunt referendum automatically |

---

### 9. Sequencing and Impulse

VTES uses a layered priority system to resolve multiple players wanting to play cards or effects at the same time. **Impulse** is the opportunity to play the next card or effect inside a specific timing window. **Sequencing** is the structured ordering used by windows that do not use the reset-on-play impulse loop.

Key distinction:
- **Impulse is not phase-level.** Entering a phase does not open an impulse window, and a table-wide pass does not advance the phase.
- **Impulse windows** are opened by concrete protocol events, such as action/block exchanges, combat timing windows, or card/effect timing conflicts. If any Methuselah plays a card or effect in such a window, the acting Methuselah regains impulse and the pass sequence restarts.
- **Sequencing windows** govern restricted timing points such as As Announced, After Resolution, and referendum polling where the engine should not use the generic phase-level impulse model.

This is a **cross-cutting mechanic** required by Voting (§1), Action/Blocking (§2), and Combat (§3).

**Rules summary** (Advanced Rules — Sequencing; full detail: [VEKN Detailed Play Summary](https://www.vekn.net/detailed-play-summary)):

- The **acting Methuselah always has the first impulse** and may chain as many cards/effects as they wish.
- Once they pass, impulse travels to other players in a context-dependent order:
  - **Combat / action directed at a single Methuselah** — defending Methuselah first, then others clockwise.
  - **Action directed at a set of Methuselahs** — those Methuselahs in clockwise order, then others.
  - **Undirected action** — prey first, then predator, then all others clockwise.
- **If any Methuselah plays a card or effect at any point, the acting Methuselah regains the impulse**, and the cycle restarts.
- The window closes only when all Methuselahs pass consecutively.

This creates a "round-robin until all pass, with reset on any play" loop — conceptually similar to a stack/priority system in other card games.

**Current state:** Partially implemented. `ImpulseState` and impulse commands exist, but formal action, combat, referendum, and sequencing integration is incomplete. Permissive mode still relies on players to manage many timing disputes verbally through chat.

**State model (`ImpulseState` on `GameData`):**

| Field                  | Type                                                              | Description                                         |
|------------------------|-------------------------------------------------------------------|-----------------------------------------------------|
| `active`               | boolean                                                           | Whether an impulse window is currently open         |
| `context`              | `COMBAT` \| `DIRECTED_SINGLE` \| `DIRECTED_MULTI` \| `UNDIRECTED` | Determines pass order                               |
| `actingPlayer`         | String                                                            | The player who initiated the action/combat/vote     |
| `currentImpulseHolder` | String                                                            | Player who currently holds impulse                  |
| `passOrder`            | List\<String\>                                                    | Resolved clockwise sequence for the current context |
| `consecutivePasses`    | int                                                               | Resets to 0 whenever any player uses a card/effect  |

**Commands:**

| Command              | Fields                    | Description                                                                                                                                     |
|----------------------|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `OpenImpulseWindow`  | `context`, `actingPlayer` | Start an impulse window; computes `passOrder` from current seating and context                                                                  |
| `PassImpulse`        | `playerName`              | Player declines to play; advances `currentImpulseHolder`. If all pass consecutively, closes the window                                          |
| `ClaimImpulse`       | `playerName`              | Player plays a card/effect; returns impulse to the acting Methuselah and resets `consecutivePasses`                                             |
| `CloseImpulseWindow` | —                         | Explicitly close the window when all players have passed (or server auto-closes after `PassImpulse` when `consecutivePasses == passOrder.size`) |

**Relationship to other systems:**
- `DeclareAction` (§2) should open the appropriate action/block timing window with context `DIRECTED_SINGLE` or `UNDIRECTED`.
- Combat timing steps should open context-specific windows as needed; combat is not a generic phase-level window.
- Referendum polling should use referendum sequencing rules rather than the phase-level impulse model.
- Card plays during an open impulse window should dispatch `ClaimImpulse` before applying their effect.

---

### 10. Anarch Conversion

| Mechanic                                                                                                 | Rulebook reference |
|----------------------------------------------------------------------------------------------------------|--------------------|
| Converting a ready vampire to Anarch costs 2 blood (or 1 if controller already has another ready Anarch) | Anarch Sect        |
| Converted vampire becomes Anarch independent                                                             | Anarch Sect        |

**Proposed command:**

| Command           | Fields | Description                                                                           |
|-------------------|--------|---------------------------------------------------------------------------------------|
| `ConvertToAnarch` | `ref`  | Pay blood cost (checking for existing Anarch discount), update vampire sect to ANARCH |

---

### 11. Game End Detection

| Mechanic                                                     | Rulebook reference |
|--------------------------------------------------------------|--------------------|
| Last surviving player gains +1 VP                            | Victory Conditions |
| Library exhaustion withdrawal — specific conditions required | Withdrawal         |

Currently `OustPlayer` marks players ousted but does not detect when only one player remains or auto-apply the survivor VP. A post-`OustPlayer` hook should check remaining player count and, if one player remains, award +1 VP and transition game to `COMPLETED`.

---

### 12. Card Play Phase Gating

`PlayCard` currently has no phase or card-type validation. Any card in `HAND` can be played in any phase by whoever holds impulse. The full rules are defined in [card-play-rules.md](card-play-rules.md).

**Missing mechanics:**

| Mechanic                                                                               | Notes                                                            |
|----------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `PlayCard` phase enforcement by card type (Master/Minion/Unlock/Discard)               | No phase check; any card plays in any phase                      |
| Action Modifier restricted to acting player; Reaction restricted to non-acting players | Not enforced                                                     |
| Out-of-turn Master detection (`CardData.outOfTurn` flag)                               | Not derived from card text at build time                         |
| Out-of-turn master action cost (next master phase action, or trifle use)               | No `masterActionsRemaining` on `GameData`                        |
| Conviction cards playable from `ASH_HEAP`                                              | `PlayCard` restricted to `PLAYABLE_REGIONS` (HAND / RESEARCH)    |
| `CONVICTION` and `POWER` card types                                                    | Both map to `CardType.NONE` in `GameInitService.toCardType()`    |
| `LOCATION` enum value reachable                                                        | Location cards import as `MASTER`; `CardType.LOCATION` is unused |

**Proposed implementation work:**

- Add `CONVICTION` and `POWER` to `CardType` enum; update `toCardType()` in `GameInitService.java`.
- Add `outOfTurn` boolean to `CardData`; populate in `GameInitService.buildCard()` by checking card text for `"out-of-turn"`.
- Add `masterActionsRemaining` to `GameData`; set to 1 on `MASTER` phase entry; deducted by each master play (including out-of-turn plays against the player's next master phase).
- Add phase + card-type guard in `CardMovementHandler.handlePlayCard()`.
- Extend allowed source regions for Conviction: check `ASH_HEAP` in addition to `PLAYABLE_REGIONS`.
- Update `CardContextMenu` in frontend to show Play only when phase matches card type.

---

### 13. Named Counter Types and Attached Conviction Cards

#### Named counters

`AddCounter` / `RemoveCounter` are generic. Several counter types have specific semantics that the engine does not yet distinguish:

| Counter type                                          | Mechanic                                                                                                                                                                                                                                                                 |
|-------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Corruption**                                        | Placed on an opposing minion by certain cards. The minion's controller must pay blood/life costs or is subject to restrictions while they hold corruption counters. Cross-player ownership — the counter belongs to the placing Methuselah, not the target's controller. |
| **Disease / Surge / Oath / Riddle / Phobia / Poison** | Each is a named counter type used by specific cards; the count matters per-card and should not be confused with blood counters.                                                                                                                                          |

**Proposed work:** Add a `counterType` field to `AddCounter` / `RemoveCounter` (or a separate counter map on `CardState` keyed by type) so that cards can query and spend counters by name.

#### Aye and Orun (Laibon conviction cards)

**Aye** and **Orun** are master cards, not counters. They are placed face-up on a Laibon Imbued via `AttachCard` (the same mechanism as retainers/equipment). Cards that reference "X Aye on him" or "X Orun on her" count the number of attached Aye or Orun cards, not a counter value.

The engine already supports attached cards via `AttachCard`, so Aye/Orun placement is mechanically covered. The gap is in card-text parsing: effects that read `"lock X Aye on him"` or `"burn an Aye"` must query the attached-card list filtered by card name, not a counter field.

---

### 14. Minion Traits

Traits are attributes a minion can have that interact with other game effects. They allow a minion to play cards requiring that trait, or make the minion subject to specific automatic rules. None of the following traits are currently modeled or detected at build time.

| Trait            | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Black Hand**   | Allows a minion to play or use cards that require a Black Hand minion.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Blood Cursed** | A Blood Cursed vampire cannot commit diablerie.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Circle**       | Each Blood Brother is identified with a particular circle (parsed from card text). A minion without a circle designation is their own circle. Cards requiring "a Blood Brother of the same circle" compare circle values. Note: Inner Circle is a Camarilla title — it is not a Blood Brother circle.                                                                                                                                                                                                                                                                                                                                                                                |
| **Flight**       | Allows a minion to play or use cards that require Flight.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Infernal**     | An Infernal minion does not unlock as normal during the unlock phase. During their controller's unlock phase, the controller may burn 1 pool to unlock that minion.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Red List**     | Any Methuselah may use a master phase action to mark a Red List minion for the current turn. Any ready vampire they control may then enter combat with the marked minion as a +1 stealth directed action costing 1 blood (once per vampire per turn). If a vampire burns a Red List minion in combat or as a directed action (including diablerie), their controller may search their library, ash heap, and/or hand for a master Trophy card to put on that vampire, then reshuffles or draws back to hand size. Other unawarded Trophies in play may also be moved to this vampire at each Trophy controller's discretion. This occurs before any blood hunt referendum is called. |
| **Scarce**       | When a Methuselah moves a Scarce vampire from their uncontrolled region to their ready region during their influence phase, they must burn 3 pool for each vampire of the same clan they already control in their ready region.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Slave**        | A Slave minion is a slave to a specified clan. A Slave cannot perform a directed action if their controller does not control a ready member of that clan. Additionally, if a member of the specified clan controlled by the same Methuselah is blocked, the controller may lock the Slave to cancel that combat: the acting vampire unlocks and the Slave enters combat with the blocking minion instead.                                                                                                                                                                                                                                                                            |
| **Sterile**      | A Sterile vampire cannot perform actions to put other vampires in play.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

**Proposed work:**
- Add boolean flags `blackHand`, `bloodCursed`, `flight`, `infernal`, `redList`, `scarce`, `sterile` to `CardData`; populate in `GameInitService.buildCard()` by detecting keywords in card text.
- Add a `slaveClan` field (nullable String) to `CardData`; populate by parsing `"Slave: [clan]"` from card text.
- Add a `circle` field (nullable String) to `CardData`; populate by parsing the circle name from Blood Brothers crypt card text. A null value means the minion is their own circle.
- Enforce `infernal` unlock cost in `AdvancePhase` when entering UNLOCK (same location as contest upkeep, Gap §5); present a prompt to pay 1 pool or leave the minion locked.
- Enforce `scarce` pool cost alongside the existing capacity check in `InfluenceCard`.
- Block directed actions for `slave` minions when no ready member of `slaveClan` is controlled; add the redirect-combat option to block handling (Gap §2).
- Block the "put vampire in play" action for `sterile` vampires in the action declaration guard.
- Block diablerie for `bloodCursed` vampires in the action declaration guard.

---

### 15. Trophy, Investment, and Path Master Subtypes

Three master card subtypes have distinct in-play rules that are not yet specified or implemented.

| Subtype        | Rule                                                                                                                                                                                                                                  |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Trophy**     | Trophy master cards are awarded through Red List rules when a qualifying vampire burns a Red List minion in combat or as a directed action, including diablerie; Trophy handling must follow each Trophy card's text. |
| **Investment** | Enters play with a supply of blood counters drawn from the blood bank. During the controller's master phase they may move blood from the Investment to a qualifying vampire. The Investment is burned when it has no blood remaining. |
| **Path**       | Represents a vampire's moral path. A vampire can only have one Path attached. Some paths affect costs, abilities, or sect status of the vampire they are attached to.                                                                 |

**Proposed work:** Add `masterSubtype` (enum: `STANDARD`, `TRIFLE`, `TROPHY`, `INVESTMENT`, `PATH`, `LOCATION`, `WATCHTOWER`, `OUT_OF_TURN`) to `CardData`; detect from card text at build time.

---

### 16. Card Control Transfer

A small number of cards explicitly transfer control of themselves from one Methuselah to another mid-game (e.g. a reaction that places the card in the acting player's area, or a card that tells you to "give this card to another Methuselah"). The current model conflates owner and controller — every card in a region is assumed to be controlled by that region's owner.

| Mechanic            | Notes                                                                                                                                        |
|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| Owner vs controller | A card's owner is the Methuselah whose library it came from. Controller is who currently benefits from / is responsible for the card. These can differ. |
| Transfer on play    | Some cards instruct the playing Methuselah to give the card to another specific Methuselah; that player then controls the in-play card's effects and upkeep. |

**Proposed work:** Add an optional `controllerName` field to `CardState`; defaults to `null` (meaning controller = owner). Commands that read or affect the card use `controllerName` when set.

---

### 17. Hunting Ground Locations

Many master location cards carry the subtype `"Hunting ground"`. This subtype modifies how the hunt action resolves for vampires at that location.

| Mechanic                 | Notes                                                                                                                    |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Hunting ground bonus     | A vampire at a hunting ground gains an additional blood when they successfully hunt (exact bonus may vary by card text). |
| Multiple hunting grounds | A vampire can only benefit from one hunting ground per hunt action.                                                      |

This gap is coupled with Gap §2 (Hunt action is listed as an `actionType` in `DeclareAction` but hunt resolution is unspecified). Hunting ground bonuses should be applied as part of hunt resolution.

---

## Implementation Priority

| Priority | Area                                                                | Rationale                                                                                                                                                                                                                                                                                                                                                      |
|----------|---------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ~~P1~~   | ~~Transfer tracking~~                                               | **Done** — `GameData.transfersRemaining` set on INFLUENCE entry (round → 1/2/3/4, capped at 4), enforced in `TransferBlood` for UNCONTROLLED (extraction costs 2T/blood), reset to 0 on `NextTurn`. Budget shown as `nT` in phase tracker UI. `DrawCryptToUncontrolled` enforces 4T + 1 pool cost to draw from crypt to UNCONTROLLED.                          |
| ~~P1~~   | ~~Sequencing / Impulse engine~~                                     | **Done** — `ImpulseState` on `GameData`; `OpenImpulseWindow`, `PassImpulse`, `ClaimImpulse`, `CloseImpulseWindow` commands; pass-order computed from predator/prey ring per context (UNDIRECTED/DIRECTED_SINGLE/COMBAT/DIRECTED_MULTI); auto-closes when all pass consecutively; `ImpulsePanel` + `OpenImpulseButton` UI in `GameStatusBar`. Note: impulse covers only the During Action state; As Announced and After Resolution use sequencing (clockwise, no reset-on-play). |
| ~~P4~~   | ~~Advanced vampire merge~~                                          | **Done** — `MergeAdvanced` command; validates same name + one advanced, burns incoming counters/attachments, attaches incoming card to READY card.                                                                                                                                                                                                              |
| **P1**   | Voting / Referendum engine                                          | Required for any political-action deck to function; blood hunt has no fallback                                                                                                                                                                                                                                                                                 |
| **P1**   | Game end auto-detection (survivor VP)                               | Needed for accurate game records                                                                                                                                                                                                                                                                                                                               |
| **P2**   | Formal action / block declaration                                   | Adds structure; currently relies entirely on player honesty and chat                                                                                                                                                                                                                                                                                           |
| **P2**   | Stealth / intercept accumulation model (§2 extension)               | Required for formal action/block to be correct; stealth and intercept must be tracked as running totals on `PendingActionState`                                                                                                                                                                                                                                 |
| **P2**   | Directed `(D)` action blocking (§2 extension)                       | Needed alongside formal action declaration; only the target Methuselah's minions may normally attempt to block a directed action                                                                                                                                                                                                                                  |
| **P2**   | Card play phase gating                                              | Prevents illegal plays; foundation for reaction and combat windows                                                                                                                                                                                                                                                                                             |
| **P2**   | Withdrawal mechanic                                                 | Common end-game scenario                                                                                                                                                                                                                                                                                                                                       |
| **P2**   | Diablerie full resolution                                           | Currently requires many manual steps                                                                                                                                                                                                                                                                                                                           |
| **P2**   | Minion traits: Infernal, Sterile, Blood Cursed, Slave, Scarce (§14) | Infernal unlock cost is automatic; Sterile/Blood Cursed/Slave block illegal actions; Scarce enforces pool cost on influence                                                                                                                                                                                                                                     |
| **P3**   | Master phase action accounting (trifle / out-of-turn)               | Rare edge case but rule-correct                                                                                                                                                                                                                                                                                                                                |
| **P3**   | Unlock phase auto-effects (edge pool, contest upkeep)               | Quality-of-life automation                                                                                                                                                                                                                                                                                                                                     |
| **P3**   | Combat system                                                       | Complex; most tables already manage manually through counter adjustments                                                                                                                                                                                                                                                                                       |
| **P3**   | Minion traits: Black Hand, Flight, Red List, Circle (§14)           | Parse-time flags; required for card requirement checks and Red List mark-and-hunt mechanic                                                                                                                                                                                                                                                                     |
| **P3**   | Named counter types (§13)                                           | Corruption counters have cross-player semantics; Aye/Orun are attached cards counted by name                                                                                                                                                                                                                                                                   |
| **P3**   | Limited effect enforcement (§12 / card-play-rules.md)               | Requires per-action and per-combat-round tracking of whether a limited source has been used                                                                                                                                                                                                                                                                    |
| **P3**   | Trophy / Investment / Path subtypes (§15)                           | Master subtype parsing is prerequisite for correct in-play behavior                                                                                                                                                                                                                                                                                            |
| **P4**   | Anarch conversion command                                           | Convenience; achievable today via manual counter + SetTitle                                                                                                                                                                                                                                                                                                    |
| **P4**   | Card control transfer (§16)                                         | Affects only a handful of cards; owner/controller split is a prerequisite                                                                                                                                                                                                                                                                                      |
| **P4**   | Hunting ground bonus on hunt resolution (§17)                       | Dependent on formal hunt action being implemented in §2                                                                                                                                                                                                                                                                                                        |
