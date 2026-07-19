# Board Regions & Interactions

> No corresponding rules document — board rendering is a JOL-specific UI feature.
>
> Companion to [Board Design — Stage & Ring](./board-design.md), which describes the board architecture. This document holds the display rules shared by every renderer: region visibility, the Text (Ledger) board, the drag-and-drop model, and the card context menu. The former Strip (`PlayerBoard`) and Table (`CircularBoard`) layouts described in earlier revisions have been retired — the Stage replaced them.

`GamePage` offers two renderers controlled by the `boardLayout` state: **Stage** (`stage`, the default) and **Text** (`text`). Legacy `linear` / `circular` preference values fold into `stage`.

Both renderers receive the same `GameState` and render the same nine `RegionType` values:

```
READY | UNCONTROLLED | TORPOR | RESEARCH | HAND | LIBRARY | CRYPT | ASH_HEAP | REMOVED_FROM_GAME
```

---

## Region visibility rules

These rules apply across all renderers. Each `RegionState` carries a `visible` flag from the server; client code enforces additional display rules on top.

| Region            | Always shown?                                  | Hidden when empty | Visibility of card content                                                                  |
|-------------------|------------------------------------------------|-------------------|---------------------------------------------------------------------------------------------|
| READY             | Yes                                            | No                | Always visible                                                                              |
| UNCONTROLLED      | Yes (Stage); hidden when empty (Text)          | Text only         | Visible to owner; Hidden from opponents — slots shown with counter/lock state, no card UUID |
| TORPOR            | Only when `count > 0`                          | Yes               | Always visible                                                                              |
| RESEARCH          | Only when `count > 0`                          | Yes               | Visible to owner; Hidden from opponents                                                     |
| HAND              | Yes                                            | No                | Visible to owner; Hidden from opponents — shown as face-down compact stack                  |
| LIBRARY           | Yes                                            | No                | Hidden — shown as face-down compact stack                                                   |
| CRYPT             | Yes                                            | No                | Hidden — shown as face-down compact stack                                                   |
| ASH_HEAP          | Context-dependent (see per-renderer rules)     | No                | Visible when `region.visible === true`; otherwise `RegionBadge` count                       |
| REMOVED_FROM_GAME | Only when `count > 0`                          | Yes               | Text layout: visible; Stage: `RegionBadge` count                                            |

**Hidden card rendering**: when `region.visible === false` or `card.faceDown === true`, card rows render as `***********` (Text) or a card back (Stage), with no card identity information exposed.

**UNCONTROLLED slots**: because the region is not visible to opponents, the server returns `slots` instead of card UUIDs — each slot carries counters, lock state, and child count. This lets the owning player see positional info without leaking identities to others.

---

## Stage columns — `PlayerColumn`

**Files**: `StageBoard.tsx`, `PlayerColumn.tsx`

The Stage renders one to five `PlayerColumn` tableaus per the density map in [Board Design](./board-design.md#responsive-density-map). Each `PlayerColumn` is a full-height scrollable panel:

```
[ Role label (predator/you/prey/…) | name | turn badge | pool | VP ]
[ READY (≤4 columns, minRows=2) ]
[ TORPOR ]          (when count > 0)
[ RESEARCH ]        (when count > 0)
[ UNCONTROLLED ]    (when count > 0)
─────────────────────────────────────────────────────────────
[ HAND | LIBRARY | CRYPT | ASH_HEAP | RFG ]   (pinned bottom)
```

- Ousted players render at 50% opacity.
- The tapped-focus column carries the arcane tint; the turn player carries an explicit `turn` badge.
- Card width comes from the density map's `--card-w`, multiplied by the user card-size slider.

---

## Text layout (`text`) — `TextBoard`

**File**: `TextBoard.tsx`

All players rendered as side-by-side scrollable columns (`min-w-52`, horizontal scroll when overflow). Optimised for low bandwidth and accessibility — no card images, all data as text. This is the seed of the **Ledger** renderer in [Board Design](./board-design.md#renderers) and is never removed.

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

## Drag-and-drop model (Stage)

All active regions (READY, TORPOR, RESEARCH, UNCONTROLLED) and compact regions share **one `DndContext`** per player column, enabling cross-region drag-and-drop within that player's tableau.

**Cross-player drag-and-drop is not supported.** Each `PlayerColumn` has its own isolated `DndContext`. Moving a card to another player's region must be done via a context menu command, not by dragging.

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

HAND, LIBRARY, CRYPT, and ASH_HEAP have no within-region DnD callbacks (no reorder, no internal attach). They are valid drop targets from other regions but cards cannot be rearranged within them via DnD. The viewer's own hand in the Dock supports drag reorder via `HandStrip`.

---

## Shared infrastructure

### `usePlayerRegions`

The Stage calls `usePlayerRegions(player, cards, gameId, onCommand)` to derive per-region stacks and cross-region move callbacks. The hook:

- Derives the nine regions from `player.regions`.
- Converts each `RegionState` into `CardData[][]` (array of stacks) via `regionToStacks`.
- HAND uses `regionToStacks(hand, cards, true)` — the `true` flag treats the entire hand as a single face-down stack.
- Exposes `handleCrossRegionMove` and `handleCrossCardMove` which build `CardRef` position references and dispatch `moveCard` / `attachCard` commands.

### `FieldRegionDndGroup`

Each player column wraps its regions in a single `FieldRegionDndGroup`, which creates one `DndContext` for all regions. This is what makes dragging a card from a compact HAND stack directly into READY work without a separate context boundary.

### Card stacks

Active regions (READY, TORPOR, RESEARCH, UNCONTROLLED) render cards as `TuckStack` — the parent card (vampire) in front at index 0, with attached cards (indices 1+) tucked behind it showing only their name strips. Strips are buttons (click, right-click, keyboard) and drag sources; on touch, a first tap fans the strips to full touch-target height and a second tap selects. See [Board Design — Card anatomy](./board-design.md#card-anatomy) for the interaction model. (`TuckStack` replaced the earlier `CardStack` vertical fan.)

Compact regions (HAND, LIBRARY, CRYPT, ASH_HEAP) render as `CompactCardStack` — a layered ghost-card pile showing at most 3 ghost layers. The top card is draggable into active regions.

---

## Card context menu

**File**: `CardContextMenu.tsx`

Right-clicking any card opens a floating context menu. The menu is mounted via a React portal on `document.body` and dismissed by pressing Escape or clicking outside it.

The menu is opened via `onCardContextMenu` callbacks wired for every region. Counter and pool values in the open menu stay live — on each render the card is looked up fresh from `gameState.cards` using the stored card UUID, so increments and decrements are reflected immediately without closing the menu.

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
