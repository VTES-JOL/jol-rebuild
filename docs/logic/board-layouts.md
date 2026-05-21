# Board Layouts

`GamePage` offers three interchangeable board layouts controlled by the `boardLayout` state. The selector in the top-right cycles between **Strip** (`linear`), **Table** (`circular`), and **Text** (`text`).

All three layouts receive the same `GameState` and render the same nine `RegionType` values:

```
READY | UNCONTROLLED | TORPOR | RESEARCH | HAND | LIBRARY | CRYPT | ASH_HEAP | REMOVED_FROM_GAME
```

---

## Region visibility rules

These rules apply across all layouts. Each `RegionState` carries a `visible` flag from the server; client code enforces additional display rules on top.

| Region | Always shown? | Hidden when empty | Visibility of card content |
|---|---|---|---|
| READY | Yes | No | Always visible |
| UNCONTROLLED | Yes (Strip/Circular); hidden when empty (Text) | Text only | Hidden — slots shown with counter/lock state, no card UUID |
| TORPOR | Only when `count > 0` | Yes | Always visible |
| RESEARCH | Only when `count > 0` | Yes | Always visible |
| HAND | Yes | No | Hidden (`faceDown`) — shown as face-down stack; top card draggable |
| LIBRARY | Yes | No | Hidden — shown as face-down compact stack |
| CRYPT | Yes | No | Hidden — shown as face-down compact stack |
| ASH_HEAP | Context-dependent (see per-layout rules below) | No | Visible when `region.visible === true`; otherwise `RegionBadge` count |
| REMOVED_FROM_GAME | Only when `count > 0` | Yes | Text layout: visible; Compact layouts: `RegionBadge` count |

**Hidden card rendering**: when `region.visible === false` or `card.faceDown === true`, card rows render as `***********` (Text) or a blank card image (Strip/Circular), with no card identity information exposed.

**UNCONTROLLED slots**: because the region is not visible to opponents, the server returns `slots` instead of card UUIDs — each slot carries counters, lock state, and child count. This lets the owning player see positional info without leaking identities to others.

---

## Strip layout (`linear`) — `PlayerBoard`

**File**: `PlayerBoard.tsx`

Each player occupies a horizontal row that wraps onto multiple lines at smaller widths. All players are visible simultaneously, stacked vertically.

### Layout structure

```
[ Player info (name, pool, VP, predator/prey) ]
[ READY (≤5 columns) ] [ TORPOR ] [ RESEARCH ] [ UNCONTROLLED (narrow gap) ]
                                  [ HAND | LIBRARY | CRYPT | ASH_HEAP | RFG ]
```

- **Active field regions** (READY, TORPOR, RESEARCH, UNCONTROLLED) render as `FieldRegion` grids in a flex-wrap row.
- **Compact regions** (HAND, LIBRARY, CRYPT, ASH_HEAP) render as stacked face-down piles aligned to the right column.
- TORPOR and RESEARCH are omitted entirely when `count === 0`.
- ASH_HEAP renders as a `RegionBadge` (count only) when `region.visible === false`; as a compact stack when visible.
- REMOVED_FROM_GAME always renders as a `RegionBadge` count only.
- The current user's row is highlighted with an arcane tint border (`bg-arcane/5 border-arcane/40`).
- Card width: `clamp(60px, 5.5vw, 72px)` (CSS `--card-w` custom property).

### Interactions

All active regions (READY, TORPOR, RESEARCH, UNCONTROLLED) and compact regions share **one `DndContext`** per player row, enabling cross-region drag-and-drop within that player's board.

**Cross-player drag-and-drop is not supported.** Each `PlayerBoard` has its own isolated `DndContext`. Moving a card to another player's region must be done via a context menu command, not by dragging.

| Gesture | Drop target | Result |
|---|---|---|
| Drag stack (grip handle) | Stack in same region | Reorder (`MOVE_CARD`, same region, new index) |
| Drag stack (grip handle) | Stack or empty slot in different region | Move top-level card to target region (`MOVE_CARD`) |
| Drag child card | Stack slot in same region | Attach to target vampire (`ATTACH_CARD`) |
| Drag child card | Empty slot in same region | Detach into own stack (`MOVE_CARD`, same region) |
| Drag child card | Stack in different region: target is minion AND dragged is library | Attach to target vampire (`ATTACH_CARD`) |
| Drag child card | Stack in different region (any other case) | Move to target region (`MOVE_CARD`) |
| Drag child card | Empty slot in different region | Move to target region, append (`MOVE_CARD`) |
| Drag any card | Compact region (HAND/LIBRARY/CRYPT/ASH_HEAP) droppable area | Move to that region, insert at top (`MOVE_CARD`, position 0) |

HAND, LIBRARY, CRYPT, and ASH_HEAP have no within-region DnD callbacks (no reorder, no internal attach). They are valid drop targets from other regions but cards cannot be rearranged within them via DnD.

---

## Table layout (`circular`) — `CircularBoard`

**File**: `CircularBoard.tsx`, `PlayerColumn.tsx`

Shows three players at once: **predator | focused | prey**. The focused player starts as the current user, or falls back to `gameState.currentPlayer`, then `orderedPlayers[0]`. Navigation buttons in the top bar shift focus along the seating order.

### Layout structure

```
[ Turn / Phase / Edge info ]   [ ◀ Predator | Prey ▶ ]
┌────────────────────────────────────────────────────────────┐
│  [ Predator column ]  [ Focused column ]  [ Prey column ]  │
└────────────────────────────────────────────────────────────┘
```

Each `PlayerColumn` is a full-height scrollable panel with:

```
[ Role label (predator/focused/prey) | name | pool | VP ]
[ READY (≤4 columns, minRows=2) ]
[ TORPOR ]          (when count > 0)
[ RESEARCH ]        (when count > 0)
[ UNCONTROLLED ]    (when count > 0)
─────────────────────────────────────────────────────────────
[ HAND | LIBRARY | CRYPT | ASH_HEAP | RFG ]   (pinned bottom)
```

- UNCONTROLLED is suppressed when empty (unlike Strip which always shows it).
- Ousted players render at 50% opacity.
- Card width: `clamp(44px, 3.5vw, 56px)` — narrower than Strip to fit three columns.
- The focused column has arcane tint styling; predator/prey columns use standard panel styling.

### Interactions

Same drag-and-drop model as Strip (one `DndContext` per `PlayerColumn`, shared across all regions). The same cross-player limitation applies — DnD is isolated to a single column. DnD commands are only wired for the focused player when `gameId` and `onCommand` are provided — predator and prey columns receive the same props but the user can only issue commands for cards they control (enforced server-side).

Navigation:
- **◀ predator** button — shifts focus to `focused.predator`; disabled when no predator exists.
- **prey ▶** button — shifts focus to `focused.prey`; disabled when no prey exists.

---

## Text layout (`text`) — `TextBoard`

**File**: `TextBoard.tsx`

All players rendered as side-by-side scrollable columns (`min-w-52`, horizontal scroll when overflow). Optimised for low bandwidth and accessibility — no card images, all data as text.

### Layout structure per column

```
[ name | pool | VP | ousted ]
READY (n)
  CardName           L  counters/capacity
    └ AttachedCard
  ***********                              ← hidden card
TORPOR (n)           (when count > 0)
RESEARCH (n)         (when count > 0)
UNCONTROLLED (n)
LIBRARY (n)
CRYPT (n)
ASH_HEAP (n)
REMOVED (n)          (when count > 0)
```

Each region is a collapsible `RegionSection`. Collapsed state initialises to `!region.visible` (hidden regions start collapsed).

### Region visibility in Text layout

- TORPOR, RESEARCH, and REMOVED_FROM_GAME are omitted when `cardIds.length === 0` (controlled by `HIDE_WHEN_EMPTY` set).
- HAND is always rendered for opponent columns regardless of card count.
- The **current player's HAND is excluded from their TextBoard column** — it is rendered instead by `TextHandPanel`, which appears as a dedicated panel to the left of the board.
- When `region.visible === false` or `card.faceDown === true`, the card row renders as `***********`.
- Children (attached cards) render indented beneath their parent with a `└` prefix. When the parent region is hidden, children are not rendered separately.

### Region render order

```
READY → TORPOR → RESEARCH → UNCONTROLLED → LIBRARY → CRYPT → ASH_HEAP → REMOVED_FROM_GAME → HAND
```

### Interactions

Each player column has its own `DndContext`. Drag activation threshold is 5px pointer distance.

| Gesture | Result |
|---|---|
| Drag a top-level card within the same region | Reorder (`onCardReorder`) |
| Drag a top-level library card over a vampire in same region | Attach to vampire (`onCardAttach`) |
| Drag a card to a different region | Move to region (`onCardMove`) |
| Drag a card to a different region and drop on a vampire | Attach to that vampire (`onCardAttach`) |
| Drag a child card to a vampire (same or different region) | Re-attach to new vampire (`onCardAttach`) |
| Drag a child card to empty region space | Detach — becomes top-level in same region (`onCardMove`) |

Child cards use `useDraggable` (drag source only, not a sortable target) to avoid interfering with the within-region sort order.

During a cross-region drag, the destination region highlights with a blue ring. When hovering over a vampire that is a valid attach target, a gold ring appears on that row.

---

## Shared infrastructure

### `usePlayerRegions`

All visual boards call `usePlayerRegions(player, cards, gameId, onCommand)` to derive per-region stacks and cross-region move callbacks. The hook:

- Derives the nine regions from `player.regions`.
- Converts each `RegionState` into `CardData[][]` (array of stacks) via `regionToStacks`.
- HAND uses `regionToStacks(hand, cards, true)` — the `true` flag treats the entire hand as a single face-down stack.
- Exposes `handleCrossRegionMove` and `handleCrossCardMove` which build `CardRef` position references and dispatch `moveCard` / `attachCard` commands.

### `FieldRegionDndGroup`

Strip and Circular boards wrap each player's regions in a single `FieldRegionDndGroup`, which creates one `DndContext` for all regions. This is what makes dragging a card from a compact HAND stack directly into READY work without a separate context boundary.

### Card stacks

Active regions (READY, TORPOR, RESEARCH, UNCONTROLLED) render cards as `CardStack` — a vertical fan with individual cards draggable out. The parent card (vampire) sits at index 0; attached library cards follow at indices 1+.

Compact regions (HAND, LIBRARY, CRYPT, ASH_HEAP) render as `CompactCardStack` — a layered ghost-card pile showing at most 3 ghost layers. The top card is draggable into active regions.

---

## Card context menu

**File**: `CardContextMenu.tsx`

Right-clicking any card that renders a `CardStack` or `CompactCardStack` opens a floating context menu. The menu is mounted via a React portal on `document.body` and dismissed by pressing Escape or clicking outside it.

The menu is opened via `onCardContextMenu` callbacks wired in `PlayerBoard` for every region. Counter and pool values in the open menu stay live — on each render the card is looked up fresh from `gameState.cards` using the stored card UUID, so increments and decrements are reflected immediately without closing the menu.

### Items shown by condition

| Item | Condition | Player |
|---|---|---|
| **Lock / Unlock** | Region is READY or TORPOR | Any |
| **Blood counter row** (− / count / +) | Region is READY, TORPOR, or UNCONTROLLED | Any |
| **Pool transfer row** (← / pool / →) | Region is READY, TORPOR, or UNCONTROLLED | Self |
| **Discard** | Region is HAND | Self |
| **Move to Torpor** | Region is READY AND card is a minion or crypt type | Any |
| **Rescue from Torpor** | Region is TORPOR | Any |
| **Burn Minion** (danger style) | Region is READY or TORPOR AND card is a minion | Any |
| **Contest / Uncontest** | `card.unique === true` AND region is READY or TORPOR | Any |
| **Set Title** | Card is a crypt type (VAMPIRE or IMBUED) AND region is READY | Any |
| **Set Notes** | Region is READY or TORPOR | Self |

### Counter and pool button logic

- Blood `−` is disabled when `card.counters === 0`.
- Pool `→` (pool → card) is disabled when `playerPool === 0`.
- Pool `←` (card → pool) is disabled when `card.counters === 0`.
- For **UNCONTROLLED** region: pool arrows dispatch `TRANSFER_BLOOD` (amount ±1).
- For **READY / TORPOR**: pool arrows dispatch `TRANSFER_BLOOD` (amount ±1).
- Counter ± buttons dispatch `ADD_COUNTER` / `REMOVE_COUNTER` and do **not** close the menu, so rapid adjustments are possible.
- All other items (move, burn, contest, etc.) close the menu immediately after dispatching.

### Cross-player moves via context menu

Cross-player card moves are not yet implemented in the context menu. The backend `MOVE_CARD` command supports targeting a different player's region, but there is currently no UI to select a target player or region. This is a known missing feature.
