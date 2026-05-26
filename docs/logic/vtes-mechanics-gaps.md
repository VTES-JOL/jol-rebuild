# VTES Mechanics Gap Analysis

Cross-reference of the [VEKN Rulebook](https://www.vekn.net/rulebook) and [Detailed Play Summary](https://www.vekn.net/detailed-play-summary) against the current JOL implementation. Source of truth for prioritising new commands and UI features.

---

## Already Implemented

| Mechanic | Implementation |
|---|---|
| Five-phase turn cycle (UNLOCK → MASTER → MINION → INFLUENCE → DISCARD) | `AdvancePhase`, `NextTurn` |
| 30-pool start, pool adjustment | `SetPool`, `TransferBlood` |
| Blood counters on cards | `AddCounter` / `RemoveCounter` |
| All nine region types (READY, UNCONTROLLED, TORPOR, HAND, LIBRARY, CRYPT, ASH_HEAP, RESEARCH, REMOVED_FROM_GAME) | `RegionType` enum, visibility rules |
| Influence system — counters on UNCONTROLLED, promote to READY | `InfluenceCard`, `MoveToCrypt`, `TransferBlood` |
| Influence transfer budget (1/2/3/4 per turn, capped at 4) enforced; extraction costs 2T/blood | `GameData.transfersRemaining`, `TransferBlood` guard, `AdvancePhase` budget set, `NextTurn` reset |
| `InfluenceCard` restricted to current player, INFLUENCE phase only, requires counters ≥ capacity > 0 | `GameCommandService.handleInfluenceCard` |
| Torpor — enter and leave | `MoveToTorpor`, `RescueFromTorpor`, `BurnMinion` |
| Edge tracking | `GainEdge` |
| Ousting and victory points | `OustPlayer`, `victoryPoints` field |
| Card lock / unlock | `LockCard`, `UnlockCard`, `UnlockAll` |
| Unique card contesting | `ContestCard`, `ClearContestCard` |
| Vampire title assignment | `SetTitle` |
| All card types (VAMPIRE, IMBUED, MASTER, ACTION, MODIFIER, REACTION, COMBAT, ALLY, RETAINER, POLITICAL, EQUIPMENT, EVENT, LOCATION) | `CardType` enum |
| Attached cards (retainers, equipment) | `AttachCard` |
| Draw / discard / shuffle | `DrawCard`, `DiscardCard`, `ShuffleLibrary`, `ShuffleCrypt` |
| General card movement between any regions | `MoveCard`, `PlayCard` |
| Order-of-play reversal | `ReverseOrder` |
| Crypt group deck-building restrictions (single or two consecutive) | `DeckValidatorService` |
| Sect and discipline fields on cards | `CardState` fields |
| Predator / prey circle derivation | `GameInitService` |

---

## Gaps by Category

### 1. Voting & Referendums

The entire referendum engine is absent. This covers blood hunt (mandatory after diablerie), political action cards, and any card that calls a vote.

**Missing mechanics:**

| Mechanic | Rulebook reference |
|---|---|
| Declaring a referendum (political action or blood hunt) | Minion Phase — Political Action |
| Vote sources: titled vampires (Primogen/Bishop = 1, Prince/Archbishop/Baron = 2, Justicar/Cardinal = 3, Inner Circle/Regent = 4) | Vampire Sects |
| Vote sources: political action card (1 vote per Methuselah) | Politics & Referendums |
| Vote sources: Edge (burn for 1 vote) | The Edge |
| Priscus block — 3 collective votes resolved by a sub-referendum among all Prisci controllers | Sabbat Titles |
| Pass / fail resolution (votes for > votes against = pass) | Politics & Referendums |
| Automatic blood hunt after diablerie | Diablerie |

**Proposed commands:**

| Command | Fields | Description |
|---|---|---|
| `CallReferendum` | `type` (BLOOD_HUNT \| POLITICAL), `targetRef?` (victim for blood hunt), `cardRef?` (political action card used) | Declare a referendum; locks the acting minion |
| `CastVote` | `playerName`, `forVotes`, `againstVotes` | Commit a player's votes for or against the open referendum |
| `ResolveReferendum` | — | Tally votes, apply pass/fail effect, close referendum |
| `BurnEdgeForVote` | `playerName` | Burn the edge to contribute 1 vote (transfers edge away and increments that player's vote total) |

A `ReferendumState` object should be added to `GameData` containing: `type`, `callerName`, `targetRef`, `votesFor`, `votesAgainst`, `playerVotes` (map), `status` (OPEN / RESOLVED).

---

### 2. Formal Action Declaration & Blocking

VTES action resolution is a structured handshake: declare → block window → resolve or fight. JOL currently has no first-class representation of an in-progress action; players manage this entirely through chat.

**Missing mechanics:**

| Mechanic | Rulebook reference |
|---|---|
| Declaring an action (locks acting minion, opens a block window) | Minion Phase — Action Resolution |
| Block attempts by ready minions of other players | Stealth & Intercept |
| Stealth vs. intercept comparison determining whether a block succeeds | Stealth & Intercept |
| Out-of-turn reaction cards (played during another player's minion phase) | Reaction Cards |
| Acting minion goes to torpor instead of combat if it was acting from torpor | Combat — Torpor exception |

**Proposed commands:**

| Command | Fields | Description |
|---|---|---|
| `DeclareAction` | `actorRef`, `actionType` (BLEED \| HUNT \| EQUIP \| EMPLOY_RETAINER \| RECRUIT_ALLY \| POLITICAL \| LEAVE_TORPOR \| RESCUE \| DIABLERISE \| CUSTOM), `targetPlayerName?`, `cardRef?` | Open an action; locks the actor; sets `pendingAction` on game state |
| `AttemptBlock` | `blockerRef` | Attempt to block the pending action with a ready minion |
| `ResolveAction` | — | Confirm the action proceeds unblocked; pays costs, applies effects |
| `AbortAction` | — | Cancel the declared action without effect (stealth/intercept negotiation) |

A `PendingActionState` on `GameData` should hold: `actorRef`, `actionType`, `targetPlayerName`, `stealth`, `intercept`, `blockerRef` (null if unblocked), `status` (DECLARED / BLOCKED / RESOLVED).

---

### 3. Combat System

Combat has no formal structure in JOL. Players simulate it through counter adjustments and torpor/burn commands. The seven-step round is entirely manual.

**Missing mechanics:**

| Mechanic | Rulebook reference |
|---|---|
| Close vs. long range; default is close | Combat — Range |
| Maneuvers to change range | Combat — Maneuvers |
| Simultaneous strike selection (hand strike, dodge, combat ends, steal blood, first strike, destroy/steal equipment) | Combat — Strikes |
| First-strike resolution before normal strikes | Combat — First Strike |
| Normal damage (burns blood to mend) vs. aggravated damage (cannot mend, forces torpor) | Combat — Damage |
| Press to continue or end combat | Combat — Press |
| Excess aggravated damage on a torpored vampire causes destruction | Combat — Damage |

**Proposed commands:**

| Command | Fields | Description |
|---|---|---|
| `EnterCombat` | `attackerRef`, `defenderRef` | Begin a combat between two ready minions; sets `pendingCombat` |
| `Maneuver` | `playerName`, `direction` (CLOSE \| LONG) | Adjust range during the range-determination step |
| `DeclareStrike` | `playerName`, `strikeType` (HAND \| DODGE \| COMBAT_ENDS \| STEAL_BLOOD \| FIRST_STRIKE \| DESTROY_EQUIPMENT \| STEAL_EQUIPMENT), `targetRef?` | Commit a strike for this round |
| `ResolveStrikes` | — | Apply both strikes simultaneously; deal damage |
| `ApplyDamage` | `targetRef`, `amount`, `aggravated` | Explicit damage step (for card effects mid-combat) |
| `Press` | `playerName`, `decision` (CONTINUE \| END) | Press decision at end of a combat round |
| `EndCombat` | — | Close the combat; clean up `pendingCombat` state |

A `PendingCombatState` on `GameData` should hold: `attackerRef`, `defenderRef`, `range` (CLOSE/LONG), `round`, `attackerStrike`, `defenderStrike`, `status`.

---

### 4. Influence Phase — Transfer Tracking

**Implemented:**

| Mechanic | Implementation |
|---|---|
| Transfer budget: 1 (turn 1.x, seat 1), 2 (seat 2), 3 (seat 3), 4 (seat 4+); always 4 from round 2 | `GameData.transfersRemaining` set by `AdvancePhase` on INFLUENCE entry via `computeTransferBudget` |
| Pool → UNCONTROLLED costs 1 transfer/blood; UNCONTROLLED → pool costs 2 transfers/blood | `TransferBlood` guard in `GameCommandService` |
| Transfers restricted to current player during INFLUENCE phase | `TransferBlood` and `InfluenceCard` guards |
| Budget shown as `nT` badge in phase tracker UI | `PhaseTracker` in `GameStatusBar` |
| Budget reset to 0 on `NextTurn` | `handleNextTurn` |

**Still missing:**

| Mechanic | Rulebook reference |
|---|---|
| 4 transfers + 1 pool to move a card from crypt to UNCONTROLLED | Influence Phase |
| Advanced vampire merge: when the base and advanced version of the same vampire are both controlled, merge them | Influence Phase |

**Proposed remaining work:**

- Add `DrawCryptToUncontrolled` command (or extend `DrawCrypt`) to enforce the 4T + 1 pool cost.
- Add `MergeAdvanced` command: `ref` (UNCONTROLLED) + `targetRef` (READY) — combines both versions, carries over blood and attached cards.

---

### 5. Unlock Phase — Automatic Effects

The unlock phase has several automatic cost / benefit rules that currently require manual execution.

| Mechanic | Rulebook reference |
|---|---|
| Edge holder may gain +1 pool during unlock phase | Unlock Phase |
| Contested unique cards cost 1 pool per unlock phase to maintain (auto-pay or yield) | Contested Cards |
| Contested titles cost 1 blood per unlock phase | Contested Titles |

**Proposed command:**

| Command | Fields | Description |
|---|---|---|
| `YieldContest` | `ref` | Yield a contested card (burns it to ash heap; saves the 1-pool/1-blood upkeep) |
| `CollectEdgePool` | `playerName` | Claim the +1 pool bonus from holding the edge during unlock |

These could also be automated server-side as part of `AdvancePhase` when leaving DISCARD → UNLOCK, presenting prompts to the client.

---

### 6. Master Phase — Action Accounting

| Mechanic | Rulebook reference |
|---|---|
| Playing a Trifle master card grants one additional master phase action | Master Phase |
| Playing an out-of-turn master card against a player reduces their next master phase action count to 0 | Master Phase |

**Proposed additions:**

- Add `masterActionsRemaining` to `GameData` (default 1 at start of MASTER phase).
- Add `ExtraMasterAction` command (dispatched when a trifle is played).
- Add `ReduceMasterActions` command (dispatched when an out-of-turn master card is played against a player).

---

### 7. Withdrawal

| Mechanic | Rulebook reference |
|---|---|
| Announce withdrawal during unlock phase | Withdrawal |
| Survive to next unlock phase without: transferring pool, playing cards, using retainers, blocking, or initiating combat | Withdrawal |
| Gain 1 VP on confirmation | Withdrawal |

**Proposed commands:**

| Command | Fields | Description |
|---|---|---|
| `AnnounceWithdrawal` | `playerName` | Flags player as attempting withdrawal; adds `withdrawalPending` state |
| `ConfirmWithdrawal` | `playerName` | Confirms survival; awards 1 VP and marks player withdrawn (not ousted) |
| `CancelWithdrawal` | `playerName` | Cancel withdrawal flag (player took a prohibited action) |

---

### 8. Diablerie — Full Resolution

`BurnMinion` handles the physical removal, but the full diablerie resolution is not automated.

| Mechanic | Rulebook reference |
|---|---|
| Victim's blood transfers to the diablerist (up to diablerist's capacity) | Diablerie |
| Diablerist may take victim's equipment | Diablerie |
| If victim is older (higher capacity), diablerist gains one of victim's disciplines | Diablerie |
| Automatic blood hunt referendum is called | Diablerie |

**Proposed command:**

| Command | Fields | Description |
|---|---|---|
| `Diablerise` | `diableristRef`, `victimRef` | Full resolution: transfer blood, optionally transfer equipment, optionally gain discipline, then call blood hunt referendum automatically |

---

### 9. Anarch Conversion

| Mechanic | Rulebook reference |
|---|---|
| Converting a ready vampire to Anarch costs 2 blood (or 1 if controller already has another ready Anarch) | Anarch Sect |
| Converted vampire becomes Anarch independent | Anarch Sect |

**Proposed command:**

| Command | Fields | Description |
|---|---|---|
| `ConvertToAnarch` | `ref` | Pay blood cost (checking for existing Anarch discount), update vampire sect to ANARCH |

---

### 10. Game End Detection

| Mechanic | Rulebook reference |
|---|---|
| Last surviving player gains +1 VP | Victory Conditions |
| Library exhaustion withdrawal — specific conditions required | Withdrawal |

Currently `OustPlayer` marks players ousted but does not detect when only one player remains or auto-apply the survivor VP. A post-`OustPlayer` hook should check remaining player count and, if one player remains, award +1 VP and transition game to `COMPLETED`.

---

## Implementation Priority

| Priority | Area | Rationale |
|---|---|---|
| ~~P1~~ | ~~Transfer tracking~~ | **Done** — `GameData.transfersRemaining` set on INFLUENCE entry (round → 1/2/3/4, capped at 4), enforced in `TransferBlood` for UNCONTROLLED (extraction costs 2T/blood), reset to 0 on `NextTurn`. Budget shown as `nT` in phase tracker UI. |
| **P1** | Voting / Referendum engine | Required for any political-action deck to function; blood hunt has no fallback |
| **P1** | Game end auto-detection (survivor VP) | Needed for accurate game records |
| **P2** | Formal action / block declaration | Adds structure; currently relies entirely on player honesty and chat |
| **P2** | Withdrawal mechanic | Common end-game scenario |
| **P2** | Diablerie full resolution | Currently requires many manual steps |
| **P3** | Master phase action accounting (trifle / out-of-turn) | Rare edge case but rule-correct |
| **P3** | Unlock phase auto-effects (edge pool, contest upkeep) | Quality-of-life automation |
| **P3** | Combat system | Complex; most tables already manage manually through counter adjustments |
| **P4** | Anarch conversion command | Convenience; achievable today via manual counter + SetTitle |
| **P4** | Advanced vampire merge | Edge case; rare in practice |
