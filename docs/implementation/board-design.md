# Board Design — Stage & Ring

> No corresponding rules document — board design is a JOL-specific UI feature.
>
> This document is the **target architecture** for the game board. It supersedes [Board Layouts](./board-layouts.md), which describes the current Strip / Table / Text implementations. Those layouts remain in the codebase (and their documentation remains accurate) until the components described here replace them.

---

## Design Thesis

VTES is a five-player game where seating order is a rule (the predator–prey circle) and worst-case board state — five players × nine regions, minions with multiple attachments, counters on everything — cannot be rendered at card-readable size on any screen. The board therefore never tries to show everything at full fidelity. Instead it splits into three permanent layers, each with its own fidelity budget:

| Layer         | Job                                                                                                              | Fidelity                          | Visibility                                  |
|---------------|------------------------------------------------------------------------------------------------------------------|-----------------------------------|---------------------------------------------|
| **Ring**      | Table awareness: every player's vitals in predator–prey order — pool, VP, hand size, edge, turn marker, attention | Compressed (chips → mini-tableaus) | Always, at every breakpoint                 |
| **Stage**     | Manipulation: one to three full tableaus at tabletop fidelity — cards, tucks, beads, lock rotation                | Full                              | Always; tableau count varies by width       |
| **Dock**      | Agency: the viewer's hand, plus the legal commands they can issue right now, rendered as buttons                  | Full hand; textual actions        | Always (bottom sheet / tab bar on mobile)   |

Two invariants follow:

1. **Components change density, never existence.** A player is always rendered — as a chip, a mini-tableau, or a full tableau. Growing the viewport enriches the board; it never rearranges it.
2. **Awareness is never sacrificed for manipulation.** All five players' vitals are on screen at every breakpoint. Detail is at most one tap away; presence is free.

---

## Renderers

Two first-class renderers consume the same `GameState` and dispatch the same commands:

| Renderer         | Description                                                                                          | Replaces                    |
|------------------|--------------------------------------------------------------------------------------------------------|-----------------------------|
| **Stage & Ring** | The visual tabletop board described in this document                                                 | Strip (`PlayerBoard`), Table (`CircularBoard`) |
| **Ledger**       | Dense, fully semantic text board — evolution of the existing `TextBoard`                             | Text (`TextBoard`)          |

The Ledger is not a fallback. It is the accessibility, low-bandwidth, and async-review story, and must maintain command parity with the visual renderer. Any mutation available on the Stage must be available from a Ledger row.

---

## Components

### Card anatomy

The base unit everything composes from. One card component with five physical states, each encoded redundantly (visual + text), never by color alone:

| State                  | Physical rendering                                                       | Redundant encoding                                  | Data source                        |
|------------------------|--------------------------------------------------------------------------|-----------------------------------------------------|------------------------------------|
| Blood / life counters  | Bead cluster on the card edge, numeral inside each bead                  | Numeral, aria-label, tooltip                        | `CardData.counters` / `capacity`   |
| Attachments            | Tucked behind the parent; name strips readable above the card top        | Indented rows in Ledger; aria tree                  | `CardData.childCardIds`            |
| Locked                 | Card rotated 90°                                                          | Padlock in tooltip and aria-label                   | `CardData.locked`                  |
| Contested              | Ribbon across the card face                                              | "Contested" text label                              | `CardData.contested`               |
| Hidden (face-down)     | Card back; counters and lock state still shown                          | Slot index + counter text                           | `RegionState.slots` (see [Game State](./game-state.md#regions)) |

Tuck-strip interaction rules:

- The strip is a first-class control: full strip width, hit area ≥ 32px on touch even where visually thinner.
- Hover or keyboard focus lifts the tucked fan (desktop); first tap lifts, second tap selects (touch).
- Every layer of a stack is a drag source, a click target, and a context-menu anchor — cards behind cards stay interactive.
- `prefers-reduced-motion` disables the lift transition; the fan opens instantly.

Region visibility rules are unchanged — the server-driven model in [Game State](./game-state.md#regions) applies to all renderers.

### Ring strip

A horizontal strip of player chips in seat order, wrapped predator → prey, with the viewer's chip visually centered. Linearizes the predator–prey circle; arrows between chips show turn direction (respecting `orderOfPlayReversed`).

Chip contents by density tier:

| Tier             | Breakpoint     | Contents                                                                                     |
|------------------|----------------|----------------------------------------------------------------------------------------------|
| **Chip**         | All            | Name, pool, VP, hand count, edge token, turn highlight, ousted strike-through, attention dot |
| **Chip + strips**| ≥ 1024px       | Adds a row of minion name strips (ready region, lock state as strip rotation)                |
| **Mini-tableau** | ≥ 1600px       | Adds torpor / uncontrolled-slot counts and blood totals per minion                           |

Behavior:

- Tapping a chip focuses that player on the Stage.
- A chip pulses (attention dot + `aria-live` announcement) when its player declares an action, is targeted, or is awaited by the current timing window.
- The current player's chip carries the turn highlight; the edge holder carries the edge token — both derived from `GameStateDto`.

### Now panel

The single always-visible answer to "what is happening, and can I act?" Fuses three things the server already tracks:

| Segment           | Contents                                                                                              | Data source                                                        |
|-------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| Phase track       | `UNLOCK → MASTER → MINION → INFLUENCE → DISCARD` with the current phase lit; turn counter               | `GameData.phase`, `turn`                                           |
| Current situation | Pending action / combat / referendum summary: actor, target, stealth/bleed values, step                 | `PendingActionState`, combat state, referendum state               |
| Impulse line      | Who holds impulse, how many players have passed, whether it is the viewer's window                      | `ImpulseState` / `ActiveTimingWindow` — see [Timing Windows](./timing-windows.md) |
| Action buttons    | The commands the viewer may legally issue right now, rendered as buttons                                | Legal-command enumeration (see Gaps below)                         |

Mode behavior:

- **Rules-enforced:** the button list is authoritative — it is the enumeration of commands the server would accept from this viewer in the current window. This one mechanism is simultaneously the game-state-clarity feature, the primary mobile input path, and the keyboard accessibility path.
- **Permissive:** degrades to phase + turn + common shortcuts (advance phase, unlock all, draw); no legality claims.

Async digest: on connect, the panel opens with a "since you left" summary compiled from the effect log (see [Game Modes](./game-modes.md) for the two-tier command/effect log) — ousts, pool changes affecting the viewer, and whose window is open — then collapses to the live view.

### Stage

Renders one to three (four on ultrawide) full tableaus. Default arrangement: **predator | viewer | prey**, mirroring who the viewer interacts with most. Focus rules:

- Tapping a Ring chip swaps that player into the focused slot.
- When a timing window opens, the acting player's tableau is auto-suggested (never auto-forced) for focus.
- Each tableau renders READY, TORPOR, UNCONTROLLED, and RESEARCH as felt zones, with compact piles for HAND / LIBRARY / CRYPT / ASH_HEAP and count badges for REMOVED_FROM_GAME — same per-region display rules as today ([Board Layouts](./board-layouts.md#region-visibility-rules)).
- Card travel between regions animates as physical motion (snap under `prefers-reduced-motion`), so state changes read as movement on a table.

### Dock

- The viewer's hand as a fanned row of full-fidelity cards; face-down to others per visibility rules.
- The Now panel's action buttons repeat here on breakpoints where the Now panel collapses.
- On mobile the Dock becomes a tab bar (`table / hand / chat`) with the hand as a bottom sheet.

### Chat rail

Chat and the game log interleave in a single stream — in an async game the log is conversation context. See [Chat](./chat.md) for protocol and storage.

- Log lines render typographically quieter (muted, indented) than player messages; filter chips (All / Talk / Log) instead of separate panels.
- Readable measure: never wider than ~60ch, never narrower than 15rem when open.
- An unread divider marks the viewer's last-read position — with the async digest, one of the two "welcome back" devices.
- Presence tiers: permanent rail (≥ 1024px), pinnable slide-over (tablet), badged tab with a one-line latest-message ticker under the Now panel (phone).

---

## Responsive Density Map

| Breakpoint      | Ring                  | Stage                                  | Chat                       | Dock                          |
|-----------------|-----------------------|----------------------------------------|----------------------------|-------------------------------|
| < 640px         | Chips (scrollable)    | 1 tableau (tap chip to switch)         | Tab + message ticker       | Action buttons + tab bar      |
| 640–1024px      | Chips                 | Viewer + focused opponent              | Pinnable slide-over        | Hand dock + actions           |
| 1024–1600px     | Chips + minion strips | Predator \| viewer \| prey             | Permanent rail             | Hand dock + actions           |
| 1600–1880px     | Mini-tableaus         | Predator \| viewer \| prey \| 4th slot | Wider rail + card preview  | Hand dock + actions           |
| ≥ 1880px        | Mini-tableaus         | Full table — all five seats, viewer centered | Wider rail + card preview  | Hand dock + actions           |

Stage breakpoints are measured on the Stage's own container (not the viewport), so a docked chat rail correctly reduces the tableau count.

Nothing is mobile-only or desktop-only; density is the only variable. A user card-size slider adjusts stage card width independently of browser zoom.

---

## Input Parity

Drag-and-drop is the delight path, never the only path. Every mutation is reachable three ways:

| Intent                     | Desktop pointer                          | Touch                                         | Keyboard / assistive                       |
|----------------------------|------------------------------------------|-----------------------------------------------|---------------------------------------------|
| Move card between regions  | Drag card → region                       | Tap card → action sheet → "Move to…"          | Select card → menu → "Move to…"             |
| Attach / detach            | Drag onto minion / drag tuck strip out   | Tap tuck strip to fan → sheet → Attach/Detach | Menu → "Attach to…" (target picker)         |
| Adjust blood / counters    | Context menu ± (menu stays open)         | Tap bead cluster → stepper                    | Menu → stepper, arrow keys                  |
| Lock / unlock              | Double-click, or menu                    | Long-press → sheet                            | Menu → Lock                                 |
| Declare / respond to action| Now panel buttons                        | Now panel buttons                             | Now panel buttons                           |

The tap-to-select + bottom action sheet is the entire mobile strategy: selecting any card shows its legal commands as full-width buttons — the context menu relocated to where thumbs are. Cross-player moves (unsupported by drag today) are covered by the "Move to…" target picker on all three paths.

---

## Theme

- **Atmosphere lives in the table, not the controls.** Felt surface, card shadows, beads, and the edge token carry the World of Darkness mood; panels, buttons, and chat stay quiet, high-contrast, and modern.
- **Red is semantic, gold is interactive.** Blood-red is reserved for meaning — damage, pool loss, attention pulses, contested state. Interactive affordances use the gold/arcane accent. Red never appears as decoration.
- **Display type only at display sizes** — player names, phase headings, oust announcements. Body and control text stays in the standard UI face.
- **Dark felt is the canonical board; a light theme must exist**, both derived from the same design tokens.

---

## Accessibility Architecture

- **The Ledger renderer is the guarantee** — same state, same commands, fully semantic HTML, switchable per device.
- **State is never encoded once:** locked = rotation + icon + label; contested = ribbon + text; blood = beads + numeral.
- **Live regions:** the game log doubles as an `aria-live` feed announcing effects as they apply.
- **Focus model:** each region is a roving-tabindex group; arrow keys walk cards, Enter opens the action menu. The Now panel is first in tab order while the viewer holds impulse.
- **Comfort:** `prefers-reduced-motion` honored everywhere; touch targets ≥ 44px; card-size slider.

---

## Migration Path

Build order chosen so each step is shippable inside the current `GamePage` without committing to the full chassis:

| Step | Component        | Builds on / replaces                                                                 |
|------|------------------|----------------------------------------------------------------------------------------|
| 1    | Card anatomy     | Replaces `CardStack` / `CompactCardStack` rendering; keeps `usePlayerRegions` and `CardContextMenu` wiring; Storybook-testable in isolation |
| 2    | Now panel        | New; reads existing phase / turn / `ImpulseState`; buttons arrive with legal-command enumeration |
| 3    | Ring strip       | New; replaces the layout switcher's "see everyone" job; can sit above any existing layout |
| 4    | Stage            | Replaces `PlayerBoard` and `CircularBoard`; density map applied                        |
| 5    | Chat rail        | Unifies chat + effect log; unread divider; async digest                                |

The Ledger renderer evolves from `TextBoard` in parallel and is never removed.

### Gaps (server-side prerequisites)

| Gap                          | Description                                                                                              |
|------------------------------|------------------------------------------------------------------------------------------------------------|
| Legal-command enumeration    | Enforced mode needs a per-viewer list of currently legal commands in `GameStateDto` (or a companion message) to drive Now panel / action sheet buttons |
| Async digest source          | A queryable effect-log slice ("effects since timestamp / last-read marker") to compile the reconnect digest |
| Last-read markers            | Per-player chat read position persisted server-side for the unread divider (interim: `GameChatRail` keeps it in localStorage, so it doesn't follow the player across devices) |
| Attention events             | A viewer-relative "you are awaited / targeted" flag derivable from `ActiveTimingWindow` pass order          |
