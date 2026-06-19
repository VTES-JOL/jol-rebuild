# Architecture Improvement Roadmap

Identified during the 2026-05 architectural review. The backend refactor (command handlers + GameRules) is already implemented. Items below are deferred but tracked here so they are not lost.

The rules-engine implementation plan now lives in [Mechanics Gaps](../implementation/mechanics-gaps.md#rules-engine-starter-tranches). This roadmap tracks the architectural changes that should be pulled into those tranches rather than implemented as detached refactors.

---

## Backend

### ~~1. `ImpulseEngine` Extraction~~ — **Done 2026-06**

`ImpulseEngine` is extracted to `net.deckserver.jol.game.ImpulseEngine` with `open()`, `pass()` (returns `null` when all players pass), and `claim()`. `buildPassOrder` is public static on the engine. `ImpulseHandler`, `TurnPhaseHandler`, and `ActionHandler` all delegate to it; `HandlerUtils.buildPassOrder` is removed. 11 plain JUnit5 unit tests in `ImpulseEngineTest` cover all methods independently of the HTTP stack. Later card-play work should use this engine for `CARD_AS_PLAYED` and action/referendum/combat windows.

### 2. Phase State Machine (deferred; needed before MASTER and UNLOCK phase enforcement)

`TurnPhaseHandler.handleAdvancePhase` cycles phases with a raw modulo and inline `if` for INFLUENCE setup. Formalise as a transition table:

```java
record PhaseTransition(Phase from, Phase to, Consumer<GameData> onEntry) {}
```

`AdvancePhase` looks up the next transition and calls `onEntry`. Prevents illegal phase skips and makes phase entry side-effects explicit and testable.

This should start with the enforced influence phase in [Mechanics Gaps Tranche 1](../implementation/mechanics-gaps.md#tranche-1--enforced-influence-phase): INFLUENCE entry sets `transfersRemaining`, and enforced flow rejects direct phase skipping while an action, referendum, combat, impulse, or sequencing window is active.

### 3. `CardData` Rule Queries (medium priority; Tranche 0/2 dependency)

`CardData` is a property bag of 15+ nullable fields. Add a `CardRules` query layer rather than refactoring the serialized data class:

```java
class CardRules {
    static boolean canBeInfluenced(CardData card) { ... }
    static boolean isUnique(CardData card) { ... }
    static int voteCount(CardData card) { ... }   // needed for referendum engine
}
```

Start with query methods needed by the first rules-engine slices:
- `isVampire`, `isImbued`, `isReadyMinion`, `isControlledBy`
- `capacityCeiling`, `canReceiveBlood`, `hasBloodAtCapacity`
- `isConviction`, `isPower`, `playableTypes`
- `nraKeyFor(ActionType, CardData actionCard)`

### 4. ~~Game End Detection~~ — **Done 2026-05**

After `OustPlayer`, if only one non-ousted player remains: awards +1 VP (survivor bonus) to that player, sets `GameData.completed = true`, transitions the `Game` entity to `Status.FINISHED`, and evicts from `GameStateStore`.

---

## Frontend

### 1. `GameContext` to Eliminate Prop Drilling (high priority)

`GamePage` → `CircularBoard` → `PlayerColumn` → `FieldRegion` passes the same 6 props through 4 levels. Extract:

```tsx
const GameContext = createContext<{
    gameState: GameState;
    gameId: string;
    currentUser: string;
    sendCommand: (cmd: GameCommand) => void;
}>(null!);
```

Intermediate layout components consume from context; leaf components still receive targeted props.

### 2. Split `FieldRegion.tsx` (medium priority)

At 842 lines it handles DnD context, drop zones, compact stacks, and full stacks. Extract:
- `useRegionDrop(regionType)` hook for drop-zone configuration
- `CompactStack` component (hand/library/crypt view)
- `FullStack` component (ready/torpor/research view)

### 3. Error Boundaries (medium priority)

A crash in `CardContextMenu` currently unmounts the entire game view. Wrap each board quadrant in an `ErrorBoundary` so a single card interaction failure is contained.

---

## Mechanic UI Patterns

These UI patterns support the mechanics prioritised in [Mechanics Gaps](../implementation/mechanics-gaps.md#implementation-priority). Backend rules work remains the source of truth for priority; frontend work should land alongside the backend protocol it exposes.

### A. Phase-Contextual Action Panel

Replace the flat button row in `GameStatusBar` with a panel driven by `gameState.phase` and `gameState.pendingXxx` state. Shows only legal actions for the current phase and active complex interaction.

- MINION phase: "Declare Action", "Call Referendum", "Enter Combat"
- INFLUENCE phase: transfer controls
- Active referendum: tally + vote casting UI
- Active combat: strike selection + range display

### B. Card Targeting Mode

A `useTargetSelection(filter: (card) => boolean)` hook in `GamePage`. While active, overrides card click handlers to collect a `CardRef` and dispatch the command that requires a target (block, diablerise, steal equipment).

```
Player clicks "Declare Action" → enters selectingTarget mode
All opposing ready minions get a highlight ring
Player clicks target → command dispatched with targetRef
Mode exits
```

### C. Referendum Modal

Renders when `gameState.pendingReferendum != null`:
- Referendum type and target
- Live vote tally (for / against)
- Per-player vote commitment UI
- "Resolve" button (acting player only)

### D. Combat Panel

Renders when `gameState.pendingCombat != null`:
- Attacker vs. defender with blood counts
- Range display with maneuver buttons
- Strike selection (cards in hand + base hand strike/dodge options)
- "Declare Strike" — committed per player, revealed simultaneously
- "Press / End" decision

### E. Enhanced Impulse Window

Current `ImpulsePanel` shows pass order and Claim/Pass buttons only. Should also:
- List playable cards from hand in the current context (reaction, modifier, combat cards)
- "Play Card" from panel dispatches `ClaimImpulse + PlayCard` atomically

---

## Frontend Command Parity and Controls

Current command parity status for existing backend commands that need either TypeScript command coverage, a visible UI control, or both:

| Command                      | TypeScript command status                   | Visible control status                         | Notes                                                                             |
|------------------------------|---------------------------------------------|------------------------------------------------|-----------------------------------------------------------------------------------|
| `GAIN_EDGE`                  | Present but missing Java `playerName` field | Present in permissive status bar               | Align `GainEdgeCommand` with `GainEdge(String gameId, String playerName)`.        |
| `UNLOCK_ALL`                 | Present but missing Java `playerName` field | Present in permissive status bar               | Align `UnlockAllCommand` with `UnlockAll(String gameId, String playerName)`.      |
| `DRAW_CRYPT_TO_UNCONTROLLED` | Missing                                     | Missing                                        | Add a paid influence-phase control distinct from permissive `DRAW_CRYPT`.         |
| `MERGE_ADVANCED`             | Missing                                     | Missing                                        | Add target-selection flow for base/advanced vampire merge in uncontrolled region. |
| `SET_GAME_NOTES`             | Present                                     | Missing                                        | Add game notes editing in a game controls or notes panel.                         |
| `REVERSE_ORDER`              | Present                                     | Present in status bar                          | No immediate roadmap work unless UX changes.                                      |
| `MOVE_TO_CRYPT`              | Present                                     | Present in uncontrolled card context menu      | No immediate roadmap work unless UX changes.                                      |
| `SET_CHOICE`                 | Present                                     | Present in player board / column choice editor | No immediate roadmap work unless UX changes.                                      |

Rules-enforced features also need new command types and controls as their backend protocols are added:

| Feature area                  | Missing command surface                                                                          | Missing visible control                                                            |
|-------------------------------|--------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| Rules-enforced phase protocol | Phase-specific enforced commands for unlock, master, influence, discard, withdrawal, and timeout | Phase-contextual action panel that replaces direct phase skipping                  |
| Action resolution             | Action-type-specific resolution commands and payloads                                            | Action declaration, target selection, and resolution panels                        |
| Card play lifecycle           | Legal card-play command shape with source, timing, replacement, cost, and destination handling   | Contextual playable-card lists and phase/type legality gating                      |
| Referendums                   | `CallReferendum`, `CastVotes`, `ResolveReferendum`, Prisci and blood-hunt payloads               | Referendum modal with vote sources, Edge vote, Prisci result, and pass/fail result |
| Blocking                      | Stealth/intercept play, block-pass, redirect, wake, and action-continuing commands               | Block-window display with eligible Methuselahs/minions and totals                  |
| Combat                        | Combat range, maneuver, strike, prevention, press, and diablerie commands                        | Combat panel for range, strike selection, damage, press, torpor, and diablerie     |
| Traits / keywords / counters  | Trait enforcement commands where explicit choices are needed; typed counter commands             | UI for named counters, keyword-derived eligibility, and required trait choices     |

---

## Recommended Implementation Sequence

1. ~~Backend refactor (handlers + GameRules)~~ — **Done 2026-05**
2. ~~Game end detection~~ — **Done 2026-05**
3. ~~Rules/data correctness baseline~~ — **Done 2026-06**
   - ~~crypt group deck validation~~
   - ~~Conviction/Power type mapping~~
   - ~~DUEL contest-rule representation~~
   - ~~enforced-mode phase impulse cleanup~~
   - ~~`ImpulseEngine` extraction~~
4. ~~Enforced influence phase~~ — **Done (Tranche 1)**
5. ~~Basic action resolution by `ActionType` + card targeting mode~~ — **Done (Tranche 2)**
6. ~~Card play legality and lifecycle~~ — **Done (Tranche 3)**
7. ~~Voting / referendum engine~~ — **Done (Tranche 4)**
8. ~~Blocking correctness: stealth/intercept, directed/undirected eligibility, redirects, wake effects~~ — **Done (Tranche 5)**
9. ~~Combat state machine, damage, torpor, combat queue~~ — **Done (Tranche 6 partial)**; action continuing (card-play wiring) still open
10. Game end completion gaps: simultaneous oust, timeout / withdrawal, GW recording
11. Diablerie full resolution: blood transfer, equipment choice, discipline gain, Trophy award, blood hunt auto-trigger
12. Leave Torpor blocked → diablerize decision prompt (controller of blocking vampire)
13. EQUIP / EMPLOY_RETAINER / RECRUIT_ALLY / RESCUE resolution effects
14. Contest upkeep (UNLOCK phase): 1 pool per contested unique, 1 blood per contested title
15. Master phase action accounting: `masterActionsRemaining` on `GameData`, trifle bonus, out-of-turn debt tracking
16. `ACTION_AS_ANNOUNCED` declaration window: wire `ActionStatus.AS_ANNOUNCED` between action-card play and block impulse
17. Combat refinements: weapon damage parsing (`CardData.ranged`), prevention ordering + fractional rounding, `WOULD_GO_TO_TORPOR` / `WOULD_BE_BURNED` replacement windows, environmental damage
18. Keyword parsing + trait enforcement: Scarce / Slave / Sterile / Blood Cursed / Red List / Trophy; rush action command
19. Remaining P3/P4 items: named counters, anarch conversion, `TransferControl`, `AddCounter` blood capacity ceiling, conviction attachment gain on imbued entering play
