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

## New Mechanic UI Patterns

These are prerequisites for implementing the three major missing subsystems (voting, actions, combat).

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

## Missing UI for Existing Commands

Several backend commands have no frontend path:

| Command | Where to add |
|---|---|
| `ReverseOrder` | Game Controls panel or status bar |
| `UnlockAll` | Game Controls panel |
| `MoveToCrypt` | Card context menu (UNCONTROLLED region) |
| `SetChoice` | Player info panel |

---

## Recommended Implementation Sequence

1. ~~Backend refactor (handlers + GameRules)~~ — **Done 2026-05**
2. ~~Game end detection~~ — **Done 2026-05**
3. Voting/Referendum engine + Referendum Modal UI
4. Phase-contextual action panel + card targeting mode
5. Formal action/blocking (integrates with existing impulse engine)
6. Combat system (most complex, plan last)
