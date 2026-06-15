# VTES Mechanics Gap Analysis

> For the VTES rules that these gaps relate to, see [VTES Rules](../rules/README.md).

Cross-reference of the [VEKN Rulebook](https://www.vekn.net/rulebook), [rulebook2024 maintained source](https://github.com/GiottoVerducci/rulebook2024/blob/main/content.md), and [Detailed Play Summary](https://www.vekn.net/detailed-play-summary) against the current JOL implementation. Source of truth for prioritising new commands and UI features.

**Status note:** many commands listed as implemented are currently **manual / permissive-mode support**, not full rules-enforced automation. The outstanding gaps are detailed in the individual implementation documents; this file provides the cross-reference index and implementation priority.

---

## Gap Details by Topic

| Topic                                                                                                                                            | Document                                                            |
|--------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| Turn and phase protocol, unlock/master/discard phases, sequencing, anarch, game end, minion traits, named counters, card control, blood capacity | [Game State](./game-state.md#implementation-gaps)                   |
| Action declaration, NRA, action resolution, action success layers                                                                                | [Actions](./actions.md)                                             |
| Block eligibility, stealth/intercept accumulation, redirects, wake effects, Action Continuing                                                    | [Blocking](./blocking.md)                                           |
| Referendum engine, vote sources, Prisci block, blood hunt                                                                                        | [Referendums](./referendums.md)                                     |
| Combat system (range, strikes, damage, press), diablerie                                                                                         | [Combat](./combat.md)                                               |
| Card play phase gating, card lifecycle, limited effects                                                                                          | [Card Play](./card-play.md)                                         |
| Card keyword parsing, trait markers, equipment/combat markers, card-family markers                                                               | [Card Keywords](./card-keywords.md)                                 |
| Frontend command surface and legal action UI                                                                                                     | [§ Frontend (below)](#frontend-command-surface-and-legal-action-ui) |

---

## Already Implemented

| Mechanic                                                                                                                                              | Implementation                                                                               | Mode / status                                                                                                    |
|-------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Five-phase turn cycle (UNLOCK → MASTER → MINION → INFLUENCE → DISCARD)                                                                                | `AdvancePhase`, `NextTurn`                                                                   | Permissive utility; full enforced phase protocol still missing                                                   |
| 30-pool start, pool adjustment                                                                                                                        | `SetPool`, `TransferBlood`                                                                   | Initial pool automatic; pool commands mostly permissive/manual                                                   |
| Blood counters on cards                                                                                                                               | `AddCounter` / `RemoveCounter`                                                               | Generic counters only; named counters and capacity ceiling missing                                               |
| All nine region types (READY, UNCONTROLLED, TORPOR, HAND, LIBRARY, CRYPT, ASH_HEAP, RESEARCH, REMOVED_FROM_GAME)                                      | `RegionType` enum, visibility rules                                                          | Implemented                                                                                                      |
| Influence system — counters on UNCONTROLLED, promote to READY                                                                                         | `InfluenceCard`, `MoveToCrypt`, `TransferBlood`                                              | Permissive utility; enforced influence protocol still incomplete                                                 |
| Influence transfer budget (1/2/3/4 per turn, capped at 4); extraction costs 2T/blood                                                                  | `GameData.transfersRemaining`, `TransferBlood` guard, `AdvancePhase` budget set              | Permissive command path; enforced-mode equivalent missing                                                        |
| `InfluenceCard` restricted to current player, INFLUENCE phase, requires counters ≥ capacity > 0                                                       | `GameCommandService.handleInfluenceCard`                                                     | Permissive command path; scarce and capacity overflow missing                                                    |
| Torpor — enter and leave                                                                                                                              | `MoveToTorpor`, `RescueFromTorpor`, `BurnMinion`                                             | Manual movement only; combat / leave-torpor / diablerie rules missing                                            |
| Edge tracking                                                                                                                                         | `GainEdge`                                                                                   | Manual token assignment only; bleed and vote integration missing                                                 |
| Ousting and victory points                                                                                                                            | `OustPlayer`, `victoryPoints` field                                                          | Permissive command path; simultaneous oust, timeout, GW missing                                                  |
| Card lock / unlock                                                                                                                                    | `LockCard`, `UnlockCard`, `UnlockAll`                                                        | Manual / utility; infernal and contest unlock rules missing                                                      |
| Unique card contesting                                                                                                                                | `ContestCard`, `ClearContestCard`                                                            | Manual flag only; upkeep / yield prompts missing                                                                 |
| Vampire title assignment                                                                                                                              | `SetTitle`                                                                                   | Manual field only; title contest and vote calculation missing                                                    |
| Card types: VAMPIRE, IMBUED, MASTER, ACTION, MODIFIER, REACTION, COMBAT, ALLY, RETAINER, POLITICAL, EQUIPMENT, EVENT                                  | `CardType` enum                                                                              | Implemented                                                                                                      |
| Card types: CONVICTION, POWER                                                                                                                         | `CardType` enum values exist; `GameInitService.toCardType()` mapping pending                 | Enum entries exist but cards import as `NONE` — see [Card Play](./card-play.md#missing-enum-values)              |
| Card type: LOCATION                                                                                                                                   | `CardType` enum entry exists; unreachable via CSV import (location cards arrive as `MASTER`) | Enum entry exists; no CSV path produces it — see [Card Keywords](./card-keywords.md)                             |
| Attached cards (retainers, equipment)                                                                                                                 | `AttachCard`                                                                                 | Manual attachment; retainer/equipment play and upkeep rules missing                                              |
| Draw / discard / shuffle                                                                                                                              | `DrawCard`, `DiscardCard`, `ShuffleLibrary`, `ShuffleCrypt`                                  | Manual / utility; replacement timing missing                                                                     |
| General card movement between any regions                                                                                                             | `MoveCard`, `PlayCard`                                                                       | Manual movement; `PlayCard` has no rule validation                                                               |
| Order-of-play reversal                                                                                                                                | `ReverseOrder`                                                                               | Implemented                                                                                                      |
| Crypt group deck-building restrictions (single or two consecutive)                                                                                    | `DeckValidatorService`                                                                       | Partial — `BaseValidator` checks size, banned, and whitelist cards only; crypt group restriction not implemented |
| Sect and discipline fields on cards                                                                                                                   | `CardData` fields                                                                            | Fields only; many trait / requirement checks missing                                                             |
| Predator / prey circle derivation                                                                                                                     | `GameInitService`                                                                            | Implemented                                                                                                      |
| Formal action declaration — `DeclareAction` / `AttemptBlock` / `ResolveAction` / `AbortAction`; `PendingActionState`                                  | `ActionHandler`, `PendingActionState`                                                        | Basic enforced protocol only; action effects and block legality incomplete                                       |
| `ActionType` enum (BLEED, HUNT, EQUIP, EMPLOY_RETAINER, RECRUIT_ALLY, POLITICAL, LEAVE_TORPOR, RESCUE, DIABLERISE, CUSTOM)                            | `ActionType`                                                                                 | Enum only; per-action resolution missing                                                                         |
| After-Resolution sequencing window — `SequencingWindowState` / `PassSequencing` / `CloseSequencingWindow`; opened by `ResolveAction`                  | `SequencingHandler`, `SequencingWindowState`                                                 | Partially implemented; ACTION_AS_ANNOUNCED and referendum/combat integration missing                             |
| `OustPlayer` awards predator 1 VP + 6 pool; last survivor +1 VP; `GameCompletedEffect` when one player remains                                        | `PlayerHandler.handleOustPlayer`                                                             | Permissive command path; simultaneous oust / timeout / GW missing                                                |
| `CardData.controller` field (distinct from `owner`)                                                                                                   | `CardData`                                                                                   | Field and projection exist; transfer command missing                                                             |
| `CardData.infernal` boolean                                                                                                                           | `CardData`                                                                                   | Field exists; unlock enforcement missing                                                                         |
| `DrawCryptToUncontrolled` — 4 transfers + 1 pool to pull from crypt                                                                                   | Implemented (permissive)                                                                     | Enforced-mode equivalent missing                                                                                 |
| `MergeAdvanced` — merge base + advanced vampire                                                                                                       | Implemented (permissive; validates name + one advanced)                                      | Enforced-mode equivalent missing                                                                                 |
| Impulse and sequencing commands (`OpenImpulseWindow`, `PassImpulse`, `ClaimImpulse`, `CloseImpulseWindow`, `PassSequencing`, `CloseSequencingWindow`) | `ImpulseEngine`, `ImpulseHandler`, `SequencingHandler`                                       | Partially implemented; `ImpulseEngine` centralises all state mutations; ACTION_AS_ANNOUNCED missing              |

---

## Frontend Command Surface and Legal Action UI

The frontend mirrors the current Java command set, but several rules-enforced commands do not exist yet, and where commands exist the UI exposes mechanical actions rather than rule-legal choices.

| Area                   | Missing frontend support                                                                                            |
|------------------------|---------------------------------------------------------------------------------------------------------------------|
| Rules-enforced phases  | No enforced turn/phase controls for unlock, master, minion, influence, and discard phase legal actions              |
| Action resolution      | No UI for choosing and resolving action-type-specific effects after `DeclareAction`                                 |
| Blocking               | No block-window eligibility display, stealth/intercept totals, redirect handling, or pass-by-block-window display   |
| Referendums            | No polling UI, vote-source display, Edge-for-vote control, Prisci sub-referendum, or pass/fail resolution view      |
| Combat                 | No combat state panel, range/maneuver controls, strike declaration, damage resolution, or press controls            |
| Card play              | Card context menu does not hide or disable `Play` based on card type, phase, actor, source region, or timing        |
| Backend command parity | `DrawCryptToUncontrolled` and `MergeAdvanced` exist in Java but are not represented in the TypeScript command union |
| Withdrawal / timeout   | No UI for withdrawal announcement / confirmation or timeout scoring                                                 |
| Control transfer       | No UI or command type for `TransferControl`                                                                         |
| Named counters         | Counter controls only support a generic counter amount                                                              |

**Proposed work:** add frontend command types and panels alongside the backend protocol changes, then gate context-menu actions using the same legality rules exposed by the server.

---

## Rules Engine Starter Tranches

The fastest route from the current permissive command set to a rules engine is to land small, testable vertical slices. Each tranche should update backend state/commands, projection DTOs, TypeScript command types, and focused tests before moving to the next tranche.

### ~~Tranche 0 — Rules/Data Correctness Baseline~~ ✓ Complete

| Task                              | Outcome                                                                                                                                                                                     |
|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ~~Crypt group validation~~        | `BaseValidator.validateCryptGroups()` rejects non-consecutive groups; `ANY` cards exempt; 6 tests added to `DeckValidatorTest`                                                              |
| ~~Card type mapping~~             | `GameInitService.toCardType()` now maps `"Conviction"` → `CONVICTION` and `"Power"` → `POWER`; test in `GameInitServiceTest` confirms neither imports as `NONE`                             |
| ~~DUEL contest rule tracking~~    | Documented in [Game State § DUEL contest exceptions](./game-state.md#duel-contest-exceptions); `ContestHandler.isDuelContestExempt()` is the enforcement branch point; `GameData.format` added |
| ~~Phase impulse cleanup~~         | `TurnPhaseHandler` gates `buildAutoImpulseEffect` on `!game.isRulesEnforced()`; 3 tests added to `GameCommandStateTest`                                                                    |
| ~~`ImpulseEngine` extraction~~    | `ImpulseEngine.open/pass/claim` consolidate all `ImpulseState` mutations; `buildPassOrder` moved from `HandlerUtils`; `ImpulseHandler`, `TurnPhaseHandler`, `ActionHandler` delegate to it; 11 unit tests in `ImpulseEngineTest` |

### ~~Tranche 1 — Enforced Influence Phase~~ ✓ Complete

| Task | Outcome |
|------|---------|
| ~~Phase transition entry~~ | `GameEffectApplicator.computeTransferBudget` handles STANDARD/V5 ramp (1/2/3/4 by seat) and DUEL exception (3 on first turn, 4 thereafter); 3 DUEL budget tests added |
| ~~Influence command ownership~~ | `isPermissiveOnly()` removed from `TransferBlood`, `InfluenceCard`, `DrawCryptToUncontrolled`, `MoveToCrypt`, `MergeAdvanced`; existing `requirePhase` + `requireCurrentPlayer` guards enforce ownership |
| ~~Blood capacity ceiling~~ | `InfluenceHandler.handleTransferBlood` rejects transfers that exceed `card.getCapacity()` in enforced mode; permissive mode is unaffected; tests verify both paths |
| ~~Influence UI parity~~ | `DrawCryptToUncontrolledCommand` and `MergeAdvancedCommand` TypeScript types + helpers added to `gameCommands.ts` |
| ~~Phase progression in enforced mode~~ | `AdvancePhase` and `NextTurn` are no longer permissive-only; `TurnPhaseHandler` adds `requireCurrentPlayer` guard in enforced mode; non-current-player rejection tested |

### ~~Tranche 2 — Action Skeleton to Legal Basic Actions~~ ✓ Complete

| Task | Outcome |
|------|---------|
| ~~Action declaration legality~~ | `ActionHandler.enforceDeclarationRules` validates NRA, mandatory hunt, recruited-ally gate, and LEAVE_TORPOR requires actor in TORPOR; all guards enforce-mode-gated |
| ~~Basic action resolution~~ | `ResolveAction` applies per-`ActionType` effects in enforced mode: BLEED deducts target pool + moves Edge; HUNT grants blood capped at capacity; LEAVE_TORPOR costs 2 blood and moves actor to READY; other types are stubs; `actionSuccessful`, `reachedResolution`, `bleedSuccessful` set on `PendingActionState` |
| ~~NRA tracking~~ | `GameData.nraActionsByCardId` (BLEED/POLITICAL keys); `NraRecordedEffect` applied by `GameEffectApplicator`; cleared in `applyTurnChanged`; recorded on both blocked and resolved paths; 16 new tests in `ActionWindowTest` |
| ~~Block eligibility baseline~~ | `ActionHandler.enforceBlockEligibility` rejects blocks when actor ≠ current impulse holder; directed actions reject non-target blockers |

### ~~Tranche 3 — Card Play Lifecycle~~ ✓ Complete

| Task | Outcome |
|------|---------|
| ~~`PlayCard` legality gate~~ | `CardMovementHandler.handlePlayCard` enforces source-region (PLAYABLE_REGIONS), phase/type gate (MASTER→MASTER, EVENT→DISCARD, ACTION/MODIFIER/REACTION/etc.→MINION), and actor gate (MODIFIER requires acting player, REACTION requires non-acting player, others require current player); `PlayCard.playAsType` added for dual-type selection; `outOfTurn` flag populated on `CardData` from card text |
| ~~As-played window~~ | `SequencingWindowType.CARD_AS_PLAYED` added; `handlePlayCard` opens a full-player sequencing window on every card play; `CardPlayState` + `CardPlayChangedEffect` track the active card-play window on `GameData` |
| ~~Replacement timing~~ | `SequencingHandler.addWindowCloseEffects` emits `DrawCardEffect` when CARD_AS_PLAYED closes and player's hand < 7; `DrawCardEffect` applicator moves top LIBRARY card(s) to HAND |
| ~~Action-card limbo~~ | ACTION cards set `PendingActionState.actionCardId`; card moves to ASH_HEAP (limbo); 10 new Cucumber scenarios in `card_play_lifecycle.feature` and `card_play_phase_gate.feature` confirm all four tasks |

### ~~Tranche 4 — Referendum Before Full Combat~~ ✓ Complete

| Task | Outcome |
|------|---------|
| ~~Referendum state~~ | `ReferendumState` added to `GameData`; `ReferendumStateChangedEffect` applied by `GameEffectApplicator`; `ResolveAction(POLITICAL)` opens referendum with 1 built-in acting-player vote; `OpenPolling`, `CastVotes`, `ClosePolling` commands fully implemented |
| ~~Vote source model~~ | Title → vote count lookup (Primogen/Bishop=1, Prince/Archbishop/Baron=2, Justicar/Cardinal=3, Inner Circle/Regent=4); per-card budget enforced; `BurnCardForVote` (one POLITICAL card per Methuselah per referendum); `BurnEdgeForVote` clears Edge holder |
| ~~Prisci sub-referendum~~ | `CastPrisciBallot` records Priscus-only ballots; strict majority of cast ballots → 3 votes contribution; tied → 0; recomputed after each ballot |
| ~~Blood hunt hook~~ | `ReferendumState.isBloodHunt` field and `targetRef` ready; auto-trigger from diablerie deferred to Tranche 5 combat; `ReferendumHandler.openReferendum` is a reusable entry point for both political and blood hunt referendums |
| ~~TypeScript mirror~~ | `OpenPollingCommand`, `CastVotesCommand`, `BurnCardForVoteCommand`, `BurnEdgeForVoteCommand`, `CastPrisciBallotCommand`, `ClosePollingCommand` added to `gameCommands.ts` |
| ~~Tests~~ | 11 new Cucumber scenarios in `referendums.feature`; all 366 tests pass |

### ~~Tranche 5 — Blocking Correctness~~ ✓ Complete

| Task | Outcome |
|------|---------|
| ~~Stealth / intercept accumulation~~ | `PendingActionState.stealth` + `interceptsByBlockerRef` (per-blocker); `AddStealth` and `AddIntercept` commands enforce "only when needed" rule |
| ~~Block attempt sub-window~~ | `SequencingWindowType.BLOCK_ATTEMPT` opened on `AttemptBlock`; `SequencingHandler` delegates close to `ActionHandler.resolveBlockAttempt`; compares intercept vs stealth to succeed or fail the block |
| ~~Directed action blocking~~ | `enforceBlockEligibility` rejects non-target blockers for directed actions; wake permission stored in `wakePermissionByCardId` bypasses locked-minion gate |
| ~~Blocks declined window~~ | `ImpulseHandler.handlePassImpulse` sets `blocksDeclined=true` and reopens impulse window (acting player first) when all players pass with no active block attempt; `AttemptBlock` rejected while `blocksDeclined` |
| ~~Action redirect~~ | `RedirectAction` command: requires `blocksDeclined=true`; updates target player; clears `blocksDeclined` and `passedBlockWindowsByPlayer`; reopens impulse window |
| ~~Wake effects~~ | `GrantWake` command adds locked minion's card ID to `wakePermissionByCardId`; `enforceBlockEligibility` allows those minions to block even when locked |
| ~~TypeScript mirror~~ | `AddStealthCommand`, `AddInterceptCommand`, `RedirectActionCommand`, `GrantWakeCommand` added to `gameCommands.ts` |
| ~~Tests~~ | 11 Cucumber scenarios in `blocking.feature`; all 366 tests pass |

### Tranche 6 — Combat and Advanced Interactions

Combat remains a larger subsystem and should build on the shared card-play and timing primitives.

| Task | Scope | Done when |
|------|-------|-----------|
| Combat state machine | Add range, maneuver, strike, damage prevention, press, and end-of-round state | Blocked/rush actions can enter and leave combat deterministically |
| Damage and torpor | Apply normal/aggravated damage, prevention, mending, torpor, and burning | Minion survival no longer requires manual movement |
| Action continuing | Implement continued block windows after effects such as Form of Mist | Continued actions preserve prior block/action context correctly |

---

## Implementation Priority

| Priority | Area                                                                       | Rationale                                                                                                                                                                                                                           |
|----------|----------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ~~P1~~   | ~~Transfer tracking data model~~                                           | **Partially done** — `GameData.transfersRemaining` exists, budget is computed in the permissive phase flow, and transfer costs are guarded on permissive `TransferBlood`. Rules-enforced influence phase support is still a P1 gap. |
| ~~P1~~   | ~~Impulse / sequencing state primitives~~                                  | **Partially done** — `ImpulseEngine` (open/pass/claim), `ImpulseState`, `SequencingWindowState`, and pass/claim/close commands exist. Phase-level auto impulse is gated to permissive mode. Protocol integration is still incomplete; ACTION_AS_ANNOUNCED is missing. |
| ~~P2~~   | ~~Formal action declaration — basic structure~~                            | **Done as a skeleton** — `DeclareAction`, `AttemptBlock`, `ResolveAction`, `AbortAction`, and `PendingActionState` exist. Action-specific effects, block legality, stealth/intercept, NRA, redirect, and continuation remain open.  |
| ~~P4~~   | ~~Advanced vampire merge~~                                                 | **Done in permissive mode** — `MergeAdvanced` command validates same name + one advanced.                                                                                                                                           |
| **P0**   | Rules/data correctness baseline                                            | Crypt group validation, Conviction/Power mapping, DUEL contest rule representation, and phase impulse cleanup are small correctness fixes that prevent later protocol work from encoding known drift. See [Rules Engine Starter Tranches](#rules-engine-starter-tranches). |
| ~~P1~~   | ~~Rules-enforced influence phase~~                                         | **Done** — `AdvancePhase`/`NextTurn` available in enforced mode with current-player guard; influence commands open in both modes; DUEL budget formula corrected; blood capacity ceiling enforced. See [Tranche 1](#tranche-1--enforced-influence-phase-complete). |
| ~~P1~~   | ~~Basic action resolution by `ActionType`~~                                | **Done (BLEED + HUNT fully; LEAVE_TORPOR partially; others stubbed)** — `ResolveAction` applies deterministic effects in enforced mode; NRA tracking, mandatory hunt, and block eligibility baseline complete. See [Tranche 2](#tranche-2--action-skeleton-to-legal-basic-actions-complete). |
| **P1**   | Card play legality and lifecycle                                           | Prevents illegal plays; prerequisite for modifiers, reactions, combat cards, cancellation, replacement timing, and action-card limbo. See [Card Play](./card-play.md).                                                              |
| **P1**   | Voting / Referendum engine                                                 | Required for political-action decks and mandatory blood hunt after diablerie. See [Referendums](./referendums.md).                                                                                                                  |
| **P1**   | Game end — simultaneous oust, timeout, GW recording                        | Predator VP+pool and last-survivor VP are partially done; simultaneous oust pool-withholding, timeout scoring, and GW field still missing. See [Game State](./game-state.md#game-end-detection).                                    |
| ~~P2~~   | ~~Stealth / intercept accumulation model~~                                 | **Done** — `AddStealth`/`AddIntercept` with "only when needed" enforcement; BLOCK_ATTEMPT sequencing sub-window resolves each attempt. See [Tranche 5](#tranche-5--blocking-correctness-complete).                                  |
| ~~P2~~   | ~~Directed / undirected action blocking~~                                  | **Done** — `enforceBlockEligibility` rejects non-target blockers; `GrantWake` permits locked minions; `RedirectAction` reopens block window. See [Tranche 5](#tranche-5--blocking-correctness-complete).                            |
| ~~P2~~   | ~~NRA tracking + block-redirect + Action Continuing~~                      | **Done (NRA + redirect)** — NRA per minion recorded on both block and resolve paths; `RedirectAction` preserves stealth/intercept context. `ACTION_CONTINUING` status deferred to Tranche 6 combat. See [Actions](./actions.md).   |
| **P2**   | Withdrawal and timeout lifecycle                                           | Common end-game scenarios; timeout also affects GW assignment. See [Game State](./game-state.md#withdrawal).                                                                                                                        |
| **P2**   | Diablerie full resolution                                                  | Blood transfer, equipment choice, discipline gain, Red List timing, Blood Cursed restriction, blood hunt. See [Combat](./combat.md#diablerie).                                                                                      |
| **P2**   | Rule-bearing minion trait enforcement                                      | `infernal` field exists; broader trait parsing and enforcement are missing. See [Card Keywords](./card-keywords.md#enforcement-hooks) and [Game State](./game-state.md#minion-traits).                                              |
| **P3**   | Combat system                                                              | Complex but required for complete rules enforcement. See [Combat](./combat.md).                                                                                                                                                     |
| **P3**   | Master phase action accounting (trifle / out-of-turn)                      | Needed for legal master-card play. See [Game State](./game-state.md#master-phase--action-accounting) and [Card Play](./card-play.md).                                                                                               |
| **P3**   | Unlock phase auto-effects and optional windows (Edge pool, contest upkeep) | Needed for rule-correct automated phase handling. See [Game State](./game-state.md#unlock-phase--automatic-effects).                                                                                                                |
| **P3**   | Requirement-marker trait parsing                                           | Required for card requirement checks and Red List / Trophy mechanics. See [Card Keywords](./card-keywords.md).                                                                                                                      |
| **P3**   | Named counter types                                                        | Corruption counters have cross-player semantics; many card effects need non-blood counters. See [Game State](./game-state.md#named-counter-types).                                                                                  |
| **P3**   | Limited effect enforcement                                                 | Requires per-action and per-combat-round tracking of limited sources. See [Card Play](./card-play.md).                                                                                                                              |
| **P3**   | Card keyword and subtype parsing                                           | Keyword parsing prerequisite for correct in-play behaviour. See [Card Keywords](./card-keywords.md).                                                                                                                                |
| **P3**   | Frontend legal action UI                                                   | Backend protocol changes need matching UI command types, panels, and legality gating. See [§ Frontend](#frontend-command-surface-and-legal-action-ui).                                                                              |
| ~~P4~~   | ~~Crypt group validation in `DeckValidatorService`~~                       | Promoted to **P0** because deck legality is isolated, testable, and currently out of sync with official rules.                                                                                                                       |
| **P4**   | Anarch conversion command                                                  | Currently achievable via manual counter + `SetTitle`; should be explicit for rules-enforced mode. See [Game State](./game-state.md#anarch-conversion).                                                                              |
| **P4**   | Card control transfer — `TransferControl` command                          | `controller` field exists; only the transfer command is missing. See [Game State](./game-state.md#card-control-transfer).                                                                                                           |
| **P4**   | Hunting ground card-effect handling                                        | Hunting Ground is a card-text keyword/family marker, not a universal hunt bonus. Specific card text should be handled through general card-effect support. See [Card Keywords](./card-keywords.md#non-goals).                       |
| **P4**   | Blood capacity overflow enforcement                                        | `AddCounter` has no ceiling; needed for rules-enforced correctness. See [Game State](./game-state.md#blood-capacity-overflow).                                                                                                      |
| **P4**   | Card Play workflow and ACTION_AS_ANNOUNCED declaration window             | `CARD_AS_PLAYED` is needed for Direct Intervention and other "as it is played" cancellers whenever a card is played; `ACTION_AS_ANNOUNCED` is needed for effects usable "as the action is announced." See [Game State](./game-state.md#sequencing-and-impulse). |
