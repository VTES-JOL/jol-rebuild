# VTES Mechanics Gap Analysis

> For the VTES rules that these gaps relate to, see [VTES Rules](../rules/README.md) for the corresponding rules documentation.

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
| Formal action declaration — DeclareAction / AttemptBlock / ResolveAction / AbortAction; `PendingActionState` on `GameData`          | `ActionHandler`, `PendingActionState`                                                             |
| `ActionType` enum (BLEED, HUNT, EQUIP, EMPLOY_RETAINER, RECRUIT_ALLY, POLITICAL, LEAVE_TORPOR, RESCUE, DIABLERISE, CUSTOM)          | `ActionType`                                                                                      |
| After-Resolution sequencing window — `SequencingWindowState` / `PassSequencing` / `CloseSequencingWindow`; opened by `ResolveAction` | `SequencingHandler`, `SequencingWindowState`                                                      |
| `OustPlayer` awards predator 1 VP + 6 pool; last survivor +1 VP; `GameCompletedEffect` when one player remains                      | `PlayerHandler.handleOustPlayer`                                                                  |
| `CardData.controller` field (distinct from `owner`)                                                                                 | `CardData`                                                                                        |
| `CardData.infernal` boolean                                                                                                         | `CardData`                                                                                        |

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
- Stealth bonuses are played by the acting player as action modifiers, but only during an active block attempt and only when the blocker's current intercept ≥ the actor's current stealth ("only when needed" rule).
- Intercept bonuses are played by blocking players (as reactions or vampire abilities), but only during an active block attempt and only when the actor's current stealth > the blocker's current intercept ("only when needed" rule).
- A block succeeds if the blocker's **final** total intercept ≥ the acting minion's **final** total stealth — i.e. after all stealth and intercept plays for that block attempt have resolved, not at the moment the blocker is declared.
- `"Optional intercept"` on a vampire means the vampire may use that source or choose not to; it is not automatic.
- Stealth and intercept totals are ephemeral — they reset after the action resolves or is blocked. During an action, stealth is tracked for the action as a whole, while intercept is tracked per blocking minion because a minion's accumulated intercept can carry forward across redirected block windows.

**Implemented commands:**

| Command         | Fields                                                                                             | Description                                                                           |
|-----------------|----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `DeclareAction` | `actorRef`, `actionType` (see `ActionType` enum), `targetPlayerName?`                              | Lock actor, set `PendingActionState` (DURING_ACTION), open impulse window             |
| `AttemptBlock`  | `blockerRef`                                                                                       | Lock blocker, mark action BLOCKED, close impulse window                               |
| `ResolveAction` | —                                                                                                  | Mark AFTER_RESOLUTION; open After Resolution sequencing window                        |
| `AbortAction`   | —                                                                                                  | Cancel action; unlock actor; close impulse and sequencing windows                     |

**`PendingActionState` as implemented** (`actorRef`, `actionType`, `targetPlayerName`, `status`, `blockerRef`):

| Field               | Implemented? | Notes                                                             |
|---------------------|:---:|-------------------------------------------------------------------|
| `actorRef`          | ✓ | CardRef of the acting minion                                      |
| `actionType`        | ✓ | One of the `ActionType` enum values                               |
| `targetPlayerName`  | ✓ | Non-null for directed actions; null for undirected                |
| `status`            | ✓ | DURING_ACTION / BLOCKED / AFTER_RESOLUTION                        |
| `blockerRef`        | ✓ | Set when a block attempt succeeds                                 |
| `stealth`           | ✗ | Action-wide running total; carries across block windows/redirects |
| `interceptsByBlockerRef` | ✗ | Per-blocker intercept map; carries forward on redirect       |
| `passedBlockWindowsByPlayer` | ✗ | Which players have passed their current block window    |
| `cannotBlockRefs`   | ✗ | Minions with explicit "cannot block" restrictions for this action |
| `currentBlockerRef` | ✗ | Active blocker during a block attempt (null if no active attempt) |

**Still missing mechanics:**

- Directed `(D)` blocking enforcement — any minion can currently block; only the target Methuselah's minions should be eligible unless card text explicitly allows others
- Stealth / intercept accumulation model — neither tracked on `PendingActionState`; the "only when needed" rule cannot be enforced
- Block redirect — new block window on action redirect; modifier persistence (stealth, intercept, bleed) carried over; prior per-window passes reset
- NRA (No Repeat Action) tracking — no per-minion record of which action types/cards have reached resolution this turn; the NRA lock persists through mid-turn unlocks
- AS_ANNOUNCED sequencing window — no command opens it; "as it is played" cancellers (e.g. Direct Intervention) have no dedicated engine window
- Action Continuing state — `ActionStatus` lacks `ACTION_CONTINUING`; required for continued-action effects (e.g. Form of Mist) that re-enter the block-attempt loop after combat

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

**Current state:** Partially implemented. `ImpulseState` and impulse commands exist. `SequencingWindowState`, `PassSequencing`, and `CloseSequencingWindow` are implemented; `ResolveAction` opens the `AFTER_RESOLUTION` window. The `AS_ANNOUNCED` window type is defined in the enum but no command opens it — "as it is played" cancellers (e.g. Direct Intervention) have no dedicated engine window. Full integration with combat and referendum protocols is still incomplete. Permissive mode still relies on players to manage many timing disputes verbally through chat.

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

| Mechanic                                                                                                             | Rulebook reference |
|----------------------------------------------------------------------------------------------------------------------|--------------------|
| Predator gains 1 VP + 6 pool from blood bank when prey is ousted                                                    | Victory Conditions |
| Simultaneous oust: all predators whose prey was ousted gain 1 VP; those who were themselves ousted do not gain pool  | Victory Conditions |
| Last surviving player gains +1 VP                                                                                    | Victory Conditions |
| Game Win (GW) awarded to the player with the most VP at game end (even if ousted)                                    | Victory Conditions |
| Timeout: all surviving players gain 0.5 VP each; no GW awarded                                                      | Tournament Rules   |
| Library exhaustion withdrawal — specific conditions required                                                         | Withdrawal         |

**Partially implemented.** `OustPlayer` now zeros the ousted player's pool, awards the predator 1 VP + 6 pool, and fires `PlayerVictoryPointsChangedEffect`. When only one player remains, it awards that survivor +1 VP and fires `GameCompletedEffect`.

Still missing:
- Simultaneous oust edge case — a predator who is themselves ousted in the same event still receives 1 VP but should **not** receive the 6 pool reward; this is not checked.
- Timeout scoring — no mechanism to award 0.5 VP to all survivors and suppress the GW.
- GW winner recording — `GameCompletedEffect` fires but no GW field is written to the game record; the player with the most VP at game end (even if ousted) should be recorded as the GW winner.

---

### 12. Card Play Phase Gating

`PlayCard` currently has no phase or card-type validation. Any card in `HAND` can be played in any phase by whoever holds impulse. The full rules are defined in [Card Play Rules](../rules/card-play.md).

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

**Partially implemented:** `CardData.infernal` boolean already exists. Enforcement in `AdvancePhase` is not yet done.

**Proposed work:**
- Add boolean flags `blackHand`, `bloodCursed`, `flight`, `redList`, `scarce`, `sterile` to `CardData`; populate in `GameInitService.buildCard()` by detecting keywords in card text.
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

| Subtype        | Rule                                                                                                                                                                                                                                                                  |
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

**Partially implemented:** `CardData.controller` (a `PlayerData` reference, distinct from `CardData.owner`) already exists and is transmitted as `controllerName` in `GameStateDto`. Defaults to `null` (meaning controller = owner).

**Proposed work:** Add a `TransferControl` command — `playerName`, `ref`, `newControllerName` — to explicitly reassign control of an in-play card to a different Methuselah.

---

### 17. Hunting Ground Locations

Many master location cards carry the subtype `"Hunting ground"`. This subtype modifies how the hunt action resolves for vampires at that location.

| Mechanic                 | Notes                                                                                                                    |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Hunting ground bonus     | A vampire at a hunting ground gains an additional blood when they successfully hunt (exact bonus may vary by card text). |
| Multiple hunting grounds | A vampire can only benefit from one hunting ground per hunt action.                                                      |

This gap is coupled with Gap §2 (Hunt action is listed as an `actionType` in `DeclareAction` but hunt resolution is unspecified). Hunting ground bonuses should be applied as part of hunt resolution.

---

### 18. Blood Capacity Overflow

| Mechanic | Rulebook reference |
|---|---|
| A vampire's blood total can never exceed their current capacity; excess blood from any source is returned to the blood bank | Card Play — Blood capacity overflow |

`AddCounter` and `RemoveCounter` are generic and do not enforce a capacity ceiling. In rules-enforced mode, any blood gain that would push a vampire above capacity should silently cap at capacity and return the excess to the bank.

**Proposed work:** Add a capacity-overflow check in `CardStateHandler.handleAddCounter` (and in the `InfluenceCard` / `RescueFromTorpor` handlers) that trims `counters` to `capacity` when `capacity > 0` and `type == VAMPIRE || IMBUED`.

---

## Implementation Priority

| Priority | Area                                                                | Rationale                                                                                                                                                                                                                                                                                                                                                      |
|----------|---------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ~~P1~~   | ~~Transfer tracking~~                                               | **Done** — `GameData.transfersRemaining` set on INFLUENCE entry (round → 1/2/3/4, capped at 4), enforced in `TransferBlood` for UNCONTROLLED (extraction costs 2T/blood), reset to 0 on `NextTurn`. Budget shown as `nT` in phase tracker UI. `DrawCryptToUncontrolled` enforces 4T + 1 pool cost to draw from crypt to UNCONTROLLED.                          |
| ~~P1~~   | ~~Sequencing / Impulse engine~~                                     | **Done** — `ImpulseState` on `GameData`; `OpenImpulseWindow`, `PassImpulse`, `ClaimImpulse`, `CloseImpulseWindow` commands; pass-order computed from predator/prey ring per context (UNDIRECTED/DIRECTED_SINGLE/COMBAT/DIRECTED_MULTI); auto-closes when all pass consecutively; `ImpulsePanel` + `OpenImpulseButton` UI in `GameStatusBar`. `SequencingWindowState`, `PassSequencing`, `CloseSequencingWindow` implemented; `ResolveAction` opens AFTER_RESOLUTION window. Note: AS_ANNOUNCED window not yet implemented. |
| ~~P2~~   | ~~Formal action declaration — basic structure~~                     | **Done** — `DeclareAction`, `AttemptBlock`, `ResolveAction`, `AbortAction` in `ActionHandler`; `PendingActionState` on `GameData` with actorRef, actionType, targetPlayerName, status, blockerRef. Stealth/intercept accumulation, directed blocking enforcement, NRA tracking, and block-redirect still missing (see §2). |
| ~~P4~~   | ~~Advanced vampire merge~~                                          | **Done** — `MergeAdvanced` command; validates same name + one advanced, burns incoming counters/attachments, attaches incoming card to READY card.                                                                                                                                                                                                              |
| **P1**   | Voting / Referendum engine                                          | Required for any political-action deck to function; blood hunt has no fallback                                                                                                                                                                                                                                                                                 |
| **P1**   | Game end — simultaneous oust, timeout, GW recording (§11)           | Predator VP+pool and last-survivor VP are done; simultaneous oust pool-withholding, timeout scoring, and GW field on game record still missing                                                                                                                                                                                                                 |
| **P2**   | Stealth / intercept accumulation model (§2 extension)               | Required for formal action/block to be correct; stealth must be tracked as an action-wide running total, and intercept must be tracked per blocking minion on `PendingActionState`                                                                                                                                                                               |
| **P2**   | Directed `(D)` action blocking (§2 extension)                       | Needed alongside formal action declaration; only the target Methuselah's minions may normally attempt to block a directed action                                                                                                                                                                                                                                  |
| **P2**   | NRA tracking + block-redirect + Action Continuing (§2 extension)    | NRA lock per minion per turn; modifier persistence across block windows on redirect; ACTION_CONTINUING status for continued-action effects                                                                                                                                                                                                                       |
| **P2**   | Card play phase gating                                              | Prevents illegal plays; foundation for reaction and combat windows                                                                                                                                                                                                                                                                                             |
| **P2**   | Withdrawal mechanic                                                 | Common end-game scenario                                                                                                                                                                                                                                                                                                                                       |
| **P2**   | Diablerie full resolution                                           | Currently requires many manual steps                                                                                                                                                                                                                                                                                                                           |
| **P2**   | Minion traits: Infernal enforcement, Sterile, Blood Cursed, Slave, Scarce (§14) | `infernal` field exists; enforcement in `AdvancePhase` not done; Sterile/Blood Cursed/Slave block illegal actions; Scarce enforces pool cost on influence                                                                                                                                                      |
| **P3**   | Master phase action accounting (trifle / out-of-turn)               | Rare edge case but rule-correct                                                                                                                                                                                                                                                                                                                                |
| **P3**   | Unlock phase auto-effects (edge pool, contest upkeep)               | Quality-of-life automation                                                                                                                                                                                                                                                                                                                                     |
| **P3**   | Combat system                                                       | Complex; most tables already manage manually through counter adjustments                                                                                                                                                                                                                                                                                       |
| **P3**   | Minion traits: Black Hand, Flight, Red List, Circle (§14)           | Parse-time flags; required for card requirement checks and Red List mark-and-hunt mechanic                                                                                                                                                                                                                                                                     |
| **P3**   | Named counter types (§13)                                           | Corruption counters have cross-player semantics; Aye/Orun are attached cards counted by name                                                                                                                                                                                                                                                                   |
| **P3**   | Limited effect enforcement (§12 / [card-play.md](../rules/card-play.md)) | Requires per-action and per-combat-round tracking of whether a limited source has been used                                                                                                                                                                                                                                                                    |
| **P3**   | Trophy / Investment / Path subtypes (§15)                           | Master subtype parsing is prerequisite for correct in-play behavior                                                                                                                                                                                                                                                                                            |
| **P4**   | Anarch conversion command                                           | Convenience; achievable today via manual counter + SetTitle                                                                                                                                                                                                                                                                                                    |
| **P4**   | Card control transfer — `TransferControl` command (§16)             | `controller` field exists; only the command to transfer it mid-game is missing                                                                                                                                                                                                                                                                                 |
| **P4**   | Hunting ground bonus on hunt resolution (§17)                       | Dependent on formal hunt action being implemented in §2                                                                                                                                                                                                                                                                                                        |
| **P4**   | Blood capacity overflow enforcement (§18)                           | `AddCounter` has no ceiling; needed for rules-enforced hunt and card-effect correctness                                                                                                                                                                                                                                                                        |
| **P4**   | AS_ANNOUNCED sequencing window (§9 extension)                       | Window type defined in enum; no command opens it; needed for Direct Intervention and other "as it is played" cancellers                                                                                                                                                                                                                                         |
