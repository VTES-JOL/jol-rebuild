# Architecture Improvement Roadmap

Identified during the 2026-05 architectural review. The backend refactor (command handlers + GameRules) is already implemented. Items below are deferred but tracked here so they are not lost.

---

## Backend

### 1. `ImpulseEngine` Extraction (medium priority)

`ImpulseState` is still mutated in two places: auto-open during `TurnPhaseHandler` and explicit commands in `ImpulseHandler`. `buildPassOrder` lives in `HandlerUtils`. Consolidate into a single `ImpulseEngine` class:

```java
class ImpulseEngine {
    static ImpulseState open(GameData game, ImpulseContext ctx, String actingPlayer, String targetPlayer);
    static ImpulseState pass(ImpulseState state);     // returns null when window closes
    static ImpulseState claim(ImpulseState state);
}
```

This makes the sequencing engine independently testable and co-located.

### 2. Phase State Machine (medium priority)

`TurnPhaseHandler.handleAdvancePhase` cycles phases with a raw modulo and inline `if` for INFLUENCE setup. Formalise as a transition table:

```java
record PhaseTransition(Phase from, Phase to, Consumer<GameData> onEntry) {}
```

`AdvancePhase` looks up the next transition and calls `onEntry`. Prevents illegal phase skips and makes phase entry side-effects explicit and testable.

### 3. `CardData` Rule Queries (low priority)

`CardData` is a property bag of 15+ nullable fields. Add a `CardRules` query layer rather than refactoring the serialized data class:

```java
class CardRules {
    static boolean canBeInfluenced(CardData card) { ... }
    static boolean isUnique(CardData card) { ... }
    static int voteCount(CardData card) { ... }   // needed for referendum engine
}
```

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
3. Rules-enforced turn and phase protocol + phase-contextual action panel
4. Basic action resolution by `ActionType` + card targeting mode
5. Card play legality and lifecycle + contextual playable-card controls
6. Voting / referendum engine + referendum modal
7. Game end completion gaps: simultaneous oust, timeout, GW recording, tournament result propagation
8. Blocking correctness: stealth/intercept, directed/undirected eligibility, redirects, wake effects, action continuation
9. Diablerie full resolution and rule-bearing minion trait enforcement
10. Combat system and combat panel
11. Remaining P3/P4 mechanics from [Mechanics Gaps](../implementation/mechanics-gaps.md#implementation-priority): master action accounting, unlock-phase automatic effects, named counters, keyword/subtype parsing, anarch conversion, control transfer, hunting-ground effects, blood capacity overflow, and ACTION_AS_ANNOUNCED.
