# Game State — Implementation

Documents the in-memory state model, data structures, commands, and WebSocket protocol for JOL game state.

See [VTES Rules — Game Flow](../rules/game-flow.md) for the tabletop rules this state model implements.

---

## Overview

The game state lives in memory (in-process `ConcurrentHashMap`) and is persisted as a JSON snapshot in the `game_state` column of the `game` table after every command. On server restart, active games are rehydrated from that snapshot.

State is never sent raw to clients. A viewer-filtered projection (`GameStateDto`) is produced for each player, hiding information they cannot legitimately see.

---

## Initialization

When a game transitions from `OPEN` to `ACTIVE`, `GameInitService` builds the initial `GameData`:

- Player order is **randomised** at init time, then fixed for the life of the game.
- The predator–prey circle is derived from player order (circular, wrapping last → first).
- Each player starts with **pool = 30**.
- The **crypt** is shuffled; the top **4 cards** are dealt face-down to the player's Uncontrolled region.
- The **library** is shuffled; the top **7 cards** are dealt to the player's Hand.
- Starting phase is `UNLOCK`; starting turn is `"1.1"`.
- The first player in the randomised order takes the first turn.

---

## Turn and Phase Structure

### Turn counter

The turn string has the format `"<round>.<seat>"`:
- `round` increments once all remaining (non-ousted) players have taken a turn.
- `seat` tracks position within the round and increments each time a player takes a turn.
- Example: in a 5-player game the sequence is `1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 2.1 → …`

### Phase cycle

`AdvancePhase` moves to the next phase. Advancing past `DISCARD` triggers `NextTurn`, which:
- Skips any ousted players.
- Sets the new current player.
- Resets phase to `UNLOCK`.
- Auto-unlocks all cards controlled by the new current player.

### Transfer budget

`transfersRemaining` is a game-level integer tracking how many influence transfers the current player has left this turn. It is set when `AdvancePhase` enters `INFLUENCE`, using a formula that depends on the game format:

V5 is mechanically identical to STANDARD — same formula, same phase rules, same player count (4–5). The only format-level difference is deck validation. DUEL shares the same mechanics except for the starting-transfer exception below.

**STANDARD / V5:**
- Round 1: `min(seat, 4)` (seat 1 → 1 transfer, seat 2 → 2 transfers, seat 3 → 3 transfers, seat 4+ → 4 transfers)
- Round 2+: always 4

**DUEL:**
- Round 1, seat 1: 3 transfers
- All other influence phases: 4 transfers

It is reset to 0 on `NextTurn`. It is sent to clients via `GameStateDto.transfersRemaining`.

### Enforced-mode phase state machine

In rules-enforced mode phase progression is driven by protocol events. `AdvancePhase` and `NextTurn` are permissive-only utilities; in enforced mode the server transitions phases automatically when the current phase resolves. Each phase has defined entry effects, available actions, and an explicit exit condition.

**UNLOCK phase**
1. Auto-unlock: `buildUnlockEffects` runs — all locked cards in READY and TORPOR belonging to the current player unlock.
2. Infernal vampires: any infernal vampire still locked after auto-unlock requires a decision — controller pays 1 pool to unlock it, or it stays locked (`InfernalUnlock` command).
3. Contest upkeep: for each unique card the current player contests, pay 1 pool or yield (`YieldContest`). For each contested title, pay 1 blood or yield.
4. Edge pool bonus: if the current player holds the Edge, they may claim +1 pool (`CollectEdgePool`), or decline.
5. Withdrawal check: if the current player has `withdrawalDeclared` set, check whether conditions were met (no pool/blood spent, no minions entered combat since last UNLOCK); if so, award 1 VP and exit without oust.
6. Exit: phase transitions to MASTER once all entry steps are resolved.

**MASTER phase**
- Entry: `masterActionsRemaining = 1`.
- Play one MASTER card from HAND per action. Trifle resolves: `masterActionsRemaining += 1` (one trifle bonus per master phase). Out-of-turn masters played by other Methuselahs consume that player's `masterActionsRemaining` on their next master phase.
- Exit: `masterActionsRemaining = 0`, or current player explicitly ends phase.

**MINION phase**
- Each ready unlocked minion may take one independent action via `DeclareAction`. Multiple actions occur sequentially. Each completed action cycle (declare → block window → resolve → after-resolution) stands alone; phase ends when the current player passes with no action pending.

**INFLUENCE phase**
- Entry: `transfersRemaining` set per seat/round formula (see Transfer budget above).
- Available: `TransferBlood`, `DrawCryptToUncontrolled`, `InfluenceCard`, `MoveToCrypt` — all gated on `transfersRemaining` and current player identity.
- Exit: current player passes or budget exhausted.

**DISCARD phase**
- Entry: `discardActionsRemaining = 1`.
- Per discard action: discard one card from HAND and draw to replace, or play one EVENT card. Effects can grant additional discard actions; max one Event card per discard phase, and each Event card may be played only once per game.
- Exit: `discardActionsRemaining = 0` or current player ends phase.

### Phase accounting fields

The following fields are added to `GameData` to support enforced phase protocol:

| Field                     | Type                          | Description                                                                                                                                                                    |
|---------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `masterActionsRemaining`  | `int`                         | Master phase action budget; set to 1 on MASTER phase entry; decremented per master card played; trifle play increments it                                                      |
| `discardActionsRemaining` | `int`                         | Discard phase budget; set to 1 on DISCARD phase entry; decremented per discard action                                                                                          |
| `nraActionsByCardId`      | `Map<String, Set<String>>`    | Per-minion NRA lock: card ID → set of locked action keys (`"BLEED"`, `"POLITICAL"`, named-card name); written when an action reaches resolution; cleared on `NextTurn` — see [Actions](./actions.md) |

### Impulse and sequencing windows

Impulse windows are opened by protocol events such as:
- Declaring or resolving an action.
- A block attempt and its stealth/intercept exchange.
- Combat timing steps.
- Referendum timing steps.
- A card/effect timing conflict where multiple Methuselahs may act.

Phase advancement remains controlled by `AdvancePhase` / `NextTurn` in permissive mode, or by the higher-level enforced protocol once its current pending action, combat, referendum, or sequencing window has closed.

#### Window state

When a protocol step opens an impulse window (`ImpulseState`), the window records:
- `actingPlayer` — the Methuselah whose action, combat, referendum, or effect created the window.
- `currentImpulseHolder` — the Methuselah currently allowed to play the next eligible card/effect.
- `context` — the timing context used to compute pass order.
- `passOrder` and `consecutivePasses` — used to close the window after all eligible Methuselahs decline to act.

The acting Methuselah starts with impulse and may play any number of legal cards/effects before passing. If any Methuselah plays a card or effect, impulse returns to the acting Methuselah and the pass sequence restarts.

#### Command gating

While an impulse or sequencing window is active, protocol-level game action commands are gated: only the player whose name matches the active priority holder may execute commands that represent playing a card or using an effect in that window. The server should expose this through the `ActiveTimingWindow` model described in [Timing Windows](./timing-windows.md#active-timing-window). At most one card/effect timing surface should be active at once.

Commands exempt from this gate:

| Command                                                                     | Reason                   |
|-----------------------------------------------------------------------------|--------------------------|
| `OpenImpulseWindow` / `PassImpulse` / `ClaimImpulse` / `CloseImpulseWindow` | Impulse system itself    |
| `PassSequencing` / `CloseSequencingWindow`                                  | Sequencing system itself |
| `SetGameNotes` / `SetCardNotes` / `SetChoice`                               | Administrative / meta    |

`AdvancePhase` and `NextTurn` do not create replacement impulse windows. In enforced mode, they should not be used to bypass an open protocol window; the enclosing action/combat/referendum flow should close or abort first.

### Edge

The **edge** is a single `PlayerData` reference indicating which player currently holds it. It is transferred via the `GainEdge` command and starts as unset.

### Order of play

A boolean flag `orderOfPlayReversed` can be toggled via `ReverseOrder`. When true, the game is progressing in reverse seating order.

---

## Player State

Each player has the following tracked values:

| Field           | Type    | Default | Description                               |
|-----------------|---------|---------|-------------------------------------------|
| `pool`          | int     | 30      | Current pool count                        |
| `victoryPoints` | float   | 0       | Victory points accumulated                |
| `ousted`        | boolean | false   | Whether the player has been ousted        |
| `prey`          | Player  | —       | The next player in seat order             |
| `predator`      | Player  | —       | The previous player in seat order         |
| `notes`         | String  | —       | Freeform notes visible to the player      |
| `choice`        | String  | —       | Player choice flag (used for game events) |

---

## Regions

Each player has exactly one instance of every region type. Region IDs are formatted as `"{playerName}-{regionType}"`.

**Visibility and UUID privacy:**
- Cards in regions visible to the viewer are transmitted in full.
- Cards in regions hidden to the viewer are **omitted entirely** from the card map — no UUID is sent to non-owners.
- The card's **owner** still receives a stub for their own hidden cards (e.g. hand, library), which carries `id`, `regionId`, `ownerName`, `parentId`, `locked`, `counters`, `notes`, and `childCardIds`.
- For the `UNCONTROLLED` region specifically, non-owning viewers receive **positional slot data** (`slots`) on the `RegionState` in place of card UUIDs. Each slot has `{index, counters, locked, childCount}`, allowing opponents to observe blood counter amounts on face-down vampires without learning the card's identity.
- Newly recruited allies are public even while temporarily placed in the uncontrolled region. The projection must reveal those ally cards to all players while continuing to hide face-down uncontrolled crypt cards.
- `RegionState.cardIds` is populated only when the region is visible to the viewer; otherwise it is an empty list.

Cards in `LIBRARY` and `CRYPT` are hidden even to their owner; count is always sent but `cardIds` is always empty.

`PLAYABLE_REGIONS` (from which cards can be played): `HAND`, `RESEARCH`.
`IN_PLAY_REGIONS` (on the board): `READY`, `TORPOR`.

---

## Card State

Every card instance has a unique UUID (`id`). The card template reference is `cardId` (matching the CSV registry).

### Transmitted in owner stubs (hidden regions, owner only)

| Field          | Description                                  |
|----------------|----------------------------------------------|
| `id`           | Unique instance UUID                         |
| `regionId`     | ID of the region this card is in             |
| `ownerName`    | Player who owns this card                    |
| `parentId`     | UUID of parent card if this card is attached |
| `childCardIds` | UUIDs of cards attached to this card         |
| `locked`       | Whether the card is tapped/locked            |
| `counters`     | Counter value on the card                    |
| `notes`        | Freeform card notes                          |

Non-owning viewers receive **no entry** in the card map for cards in hidden regions. They may receive positional slot data on the `RegionState` instead (see UNCONTROLLED above).

### Transmitted only when visible to the viewer

| Field            | Description                                                   |
|------------------|---------------------------------------------------------------|
| `cardId`         | Template ID (links to card registry)                          |
| `name`           | Card name as printed                                          |
| `type`           | `CardType` (see below)                                        |
| `contested`      | Whether the card is contested                                 |
| `votes`          | Vote count (for political cards / vampires)                   |
| `title`          | Vampire title                                                 |
| `advanced`       | Whether the vampire is the advanced version                   |
| `capacity`       | Vampire blood capacity                                        |
| `clan`           | Vampire clan                                                  |
| `sect`           | Vampire sect                                                  |
| `path`           | Vampire path (for non-Humanity vampires)                      |
| `disciplines`    | List of discipline strings                                    |
| `controllerName` | Player currently controlling the card (may differ from owner) |
| `minion`         | Whether the card is a minion (vampires, allies, imbued)       |
| `unique`         | Whether the card is unique                                    |

### Card types

`VAMPIRE`, `IMBUED`, `MASTER`, `ACTION`, `MODIFIER`, `REACTION`, `COMBAT`, `ALLY`, `RETAINER`, `POLITICAL`, `EQUIPMENT`, `EVENT`, `LOCATION`, `NONE`

`CONVICTION` and `POWER` exist in the `CardType` enum but `GameInitService.toCardType()` does not yet map to them — cards of these types import as `NONE`. `LOCATION` exists in the enum but is also unreachable via normal CSV import (location cards are typed as `MASTER` in the data). See [Card Play](./card-play.md#missing-enum-values) for the full list of pending mappings.

---

## Commands

Commands are sent via WebSocket as `GAME_COMMAND` messages. Each command carries the `gameId`. The server applies the command, persists the snapshot, then broadcasts the updated state to all connected clients.

Commands are executed under a per-game lock, so concurrent commands for the same game are serialized.

### Card addressing — `CardRef`

Card-referencing commands do **not** use card UUIDs. Instead, they use a `CardRef`, a position-based address that does not reveal any hidden card identity information.

```json
{
  "playerName": "Alice",
  "regionType": "UNCONTROLLED",
  "position": 2,
  "childIndex": -1
}
```

| Field        | Description                                                                |
|--------------|----------------------------------------------------------------------------|
| `playerName` | The player who owns the region                                             |
| `regionType` | One of the `RegionType` enum values (e.g. `READY`, `HAND`, `UNCONTROLLED`) |
| `position`   | Zero-based index of the card in the region's top-level card list           |
| `childIndex` | `-1` for a top-level card; `≥0` for an attached child at that index        |

**Rationale:** Using UUIDs in commands would allow correlation between a hidden stub UUID (visible in one state broadcast) and the card's revealed identity when it later enters a visible region. Position-based addressing prevents this tracking.

**Race condition note:** Positions are resolved at command-execution time. In the rare case that another command has changed card order since the client observed the state, the command silently no-ops (position out of range returns null).

### Target region

Commands that move a card to a region (`MoveCard`, `PlayCard`) identify the target as `(targetPlayerName, targetRegionType)` rather than a region string ID.

### Turn / phase

| Command        | Description                                                                                                                                                  |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `AdvancePhase` | Move to the next phase; wraps to next turn after DISCARD. When entering `INFLUENCE`, sets `transfersRemaining` to the current player's budget for this turn. |
| `NextTurn`     | Advance to the next non-ousted player's turn directly. Resets `transfersRemaining` to 0.                                                                     |

### Deck operations

| Command          | Fields (besides `gameId`)  | Source → Target                  | Description                                 |
|------------------|----------------------------|----------------------------------|---------------------------------------------|
| `DrawCard`       | `count`                    | `LIBRARY` → `HAND` (actor)       | Draw `count` cards from library to hand     |
| `ShuffleLibrary` | —                          | `LIBRARY` (actor, in-place)      | Shuffle the actor's library                 |
| `ShuffleCrypt`   | —                          | `CRYPT` (actor, in-place)        | Shuffle the actor's crypt                   |
| `DiscardCard`    | `ref: CardRef`             | `HAND` → `ASH_HEAP` (owner)      | Move a card from hand to ash heap           |

### Card movement

| Command            | Fields (besides `gameId`)                                 | Source → Target                                          | Description                                                                                                                                                                                            | Phase       |
|--------------------|-----------------------------------------------------------|----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| `PlayCard`         | `ref`, `targetPlayerName`, `targetRegionType`             | `HAND` or `RESEARCH` → active workflow destination       | Play a card through the active timing window. Source, phase, type, actor, priority, mode timing, cost, replacement, and destination are enforced by [Card Play](./card-play.md). **Not yet enforced.** |             |
| `MoveCard`         | `ref`, `targetPlayerName`, `targetRegionType`, `position` | any → any                                                | Move a card to any region at a given position                                                                                                                                                          |             |
| `AttachCard`       | `ref`, `targetRef`                                        | any → child of target card (typically `READY`)           | Attach a card to another card (e.g., retainer to vampire)                                                                                                                                              |             |
| `InfluenceCard`    | `ref`                                                     | `UNCONTROLLED` → owner `READY`                           | Move a fully influenced vampire/imbued to the Ready region. Actor is the current player, `counters ≥ capacity > 0`. Silently no-ops otherwise.                                                         | `INFLUENCE` |
| `MoveToCrypt`      | `ref`                                                     | `UNCONTROLLED` → owner `CRYPT` (bottom, clears counters) | Return a vampire to Crypt (influence cancelled)                                                                                                                                                        |             |
| `MoveToTorpor`     | `ref`                                                     | `READY` → owner `TORPOR`                                 | Move a minion to Torpor                                                                                                                                                                                |             |
| `RescueFromTorpor` | `ref`                                                     | `TORPOR` → owner `READY`                                 | Move a vampire from Torpor to Ready                                                                                                                                                                    |             |
| `BurnMinion`       | `ref`                                                     | `READY` or `TORPOR` → owner `ASH_HEAP`                   | Remove a minion from play entirely                                                                                                                                                                     |             |

### Card state

| Command            | Fields (besides `gameId`) | Valid `ref` region(s)         | Description                                                                                                                                                                                          | Phase |
|--------------------|---------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------|
| `LockCard`         | `ref`                     | any                           | Lock (tap) a card                                                                                                                                                                                    | Any   |
| `UnlockCard`       | `ref`                     | any                           | Unlock (untap) a card                                                                                                                                                                                | Any   |
| `UnlockAll`        | `playerName`              | — (affects `READY`, `TORPOR`) | Unlock all in-play cards controlled by a player. `NextTurn` auto-unlocks cards controlled by the incoming player; this command is the manual equivalent for mid-game effects or permissive-mode use. | Any   |
| `AddCounter`       | `ref`, `amount`           | any                           | Increment a card's counter                                                                                                                                                                           | Any   |
| `RemoveCounter`    | `ref`, `amount`           | any                           | Decrement a card's counter (floor 0)                                                                                                                                                                 | Any   |
| `SetCardNotes`     | `ref`, `notes`            | any                           | Set freeform notes on a card                                                                                                                                                                         | Any   |
| `ContestCard`      | `ref`                     | any                           | Mark a card as contested                                                                                                                                                                             | Any   |
| `ClearContestCard` | `ref`                     | any                           | Clear the contested flag                                                                                                                                                                             | Any   |
| `SetTitle`         | `ref`, `title`            | any (typically `READY`)       | Set or clear a vampire's title                                                                                                                                                                       | Any   |
| `YieldContest`     | `ref`                     | `READY`                       | Yield a contested unique card or title to the ash heap rather than pay upkeep; removes card from play                                                                                               | `UNLOCK` |
| `CollectEdgePool`  | `playerName`              | —                             | Claim the optional +1 pool from holding the Edge during the unlock phase                                                                                                                            | `UNLOCK` |
| `InfernalUnlock`   | `ref`                     | `READY`                       | Pay 1 pool to unlock an infernal vampire during the unlock phase; if declined the vampire stays locked for the turn                                                                                 | `UNLOCK` |
| `ConvertToAnarch`  | `ref`                     | `READY`                       | Convert a ready vampire to Anarch Independent; costs 2 blood, or 1 if controller already has another ready Anarch; updates vampire sect to `ANARCH`                                                | `MINION` |
| `TransferControl`  | `ref`, `newControllerName` | `READY`                      | Reassign control of an in-play card to a different Methuselah; `CardData.controller` already exists                                                                                                | Any   |

### Player state

| Command         | Fields (besides `gameId`) | Description                                                                                                                                                                                                                                                                                                         | Phase       |
|-----------------|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| `SetPool`             | `playerName`, `amount`    | Set a player's pool to an absolute value                                                                                                                                                                                                                                                           |             |
| `TransferBlood`       | `ref`, `amount`           | Transfer blood between controller's pool and a card. For `UNCONTROLLED` cards: restricted to the current player only; pool → card costs 1 transfer/blood; card → pool costs 2 transfers/blood. Silently no-ops if budget is insufficient.                                                          | `INFLUENCE` |
| `GainEdge`            | `playerName`              | Award the edge to a player                                                                                                                                                                                                                                                                         |             |
| `OustPlayer`          | `playerName`              | Mark a player as ousted; zeros their pool; awards predator 1 VP + 6 pool. If multiple players are ousted in the same resolution step, all predators whose prey is ousted receive 1 VP but pool awards are withheld. If only one player remains, awards that survivor +1 VP and completes the game. |             |
| `DeclareTimeout`      | —                         | Trigger timeout scoring: all surviving players receive 0.5 VP each; the last survivor receives the full +1 survivor VP instead; Game Win awarded to the player with ≥ 2 VP who is the sole VP leader                                                                                              |             |
| `AnnounceWithdrawal`  | `playerName`              | Flag player as attempting withdrawal; only legal during UNLOCK phase when the player's library is exhausted (hand not full at start of turn); sets `PlayerData.withdrawalDeclared = true`                                                                                                          | `UNLOCK`    |
| `ConfirmWithdrawal`   | `playerName`              | Confirm successful withdrawal: player reached next UNLOCK without losing/spending pool/blood or having minions enter combat; award 1 VP; remove player from game without oust                                                                                                                      | `UNLOCK`    |
| `CancelWithdrawal`    | `playerName`              | Cancel withdrawal attempt; player took a prohibited action after announcing; clears `withdrawalDeclared`                                                                                                                                                                                           |             |
| `SetChoice`           | `playerName`, `choice`    | Set a player's choice flag                                                                                                                                                                                                                                                                         |             |
| `ReverseOrder`        | —                         | Toggle the order-of-play reversal flag                                                                                                                                                                                                                                                             |             |

### Game state

| Command         | Description                       |
|-----------------|-----------------------------------|
| `SetGameNotes`  | Set freeform notes on the game    |

### Impulse and sequencing commands

| Command                 | Fields                    | Description                                                                                         |
|-------------------------|---------------------------|-----------------------------------------------------------------------------------------------------|
| `OpenImpulseWindow`     | `context`, `actingPlayer` | Start an impulse window; computes `passOrder` from current seating and context                      |
| `PassImpulse`           | `playerName`              | Player declines to play; advances `currentImpulseHolder`. Auto-closes when all pass consecutively   |
| `ClaimImpulse`          | `playerName`              | Player plays a card/effect; returns impulse to the acting Methuselah and resets `consecutivePasses` |
| `CloseImpulseWindow`    | —                         | Explicitly close the window                                                                         |
| `PassSequencing`        | `playerName`              | Pass in a sequencing window (After Resolution, ACTION_AS_ANNOUNCED, etc.)                           |
| `CloseSequencingWindow` | —                         | Close the open sequencing window                                                                    |

---

## Architecture Notes

### Enforced-mode phase transitions

`AdvancePhase` and `NextTurn` are permissive-only. In enforced mode the server drives phase transitions automatically. The current gap is that `TurnPhaseHandler` opens a generic undirected impulse window on `AdvancePhase` / `NextTurn`; impulse must be opened only by protocol events (action declarations, combat steps, referendum polling), not by entering a phase. This auto-open must be removed when enforced phase protocol is added.

### Influence phase implementation status

Transfer budget logic is already implemented and gates `TransferBlood`, `DrawCryptToUncontrolled`, and `InfluenceCard`. These commands are currently permissive-only; in enforced mode they need to be promoted to enforced-only with the same guards.

| Command / mechanic                                                                                          | Status                                                          |
|-------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Transfer budget 1/2/3/4 by seat (STANDARD/V5); DUEL seat-1 round-1 = 3                                     | Budget computed in `AdvancePhase`; permissive-only today        |
| Pool → UNCONTROLLED 1 transfer/blood; UNCONTROLLED → pool 2 transfers/blood                                 | Guarded in `TransferBlood`; permissive-only today               |
| `DrawCryptToUncontrolled` — 4 transfers + 1 pool                                                            | Implemented permissive                                          |
| `MergeAdvanced` — merge base + advanced vampire of same name                                                | Implemented permissive                                          |

### Sequencing and impulse integration

`ImpulseState`, `SequencingWindowState`, and all pass/claim/close commands are implemented. `ResolveAction` already opens the `AFTER_RESOLUTION` sequencing window.

Remaining integration points:
- `DeclareAction` should invoke the Card Play workflow for action cards from hand, then open the `ACTION_AS_ANNOUNCED` sequencing window before the block-attempt impulse window — see [Actions](./actions.md). `CARD_AS_PLAYED`, `ACTION_AS_ANNOUNCED`, and `ACTION_CONTINUING` must be added/renamed in their respective Java enums before these paths can be wired.
- Block-attempt stealth/intercept exchanges use the existing impulse window with `DIRECTED_SINGLE` or `UNDIRECTED` context. After all eligible Methuselahs decline block attempts, a final Blocks Declined pre-resolution impulse window remains open for legal action modifiers, reactions, and redirects before `ResolveAction` is available — see [Blocking](./blocking.md).
- Combat timing steps each have their own impulse windows with `COMBAT` context — see [Combat](./combat.md).
- Referendum polling uses its own sequencing rules — see [Referendums](./referendums.md).
- `PlayCard` must validate against the current `ActiveTimingWindow` in addition to phase/type/actor gates — see [Card Play](./card-play.md#active-window-legality).

### Game end detection

`OustPlayer` currently awards predator 1 VP + 6 pool and awards the last survivor +1 VP via `GameCompletedEffect`. The full algorithm for `handleOustPlayer` is:

1. Apply pool delta to ousted player (set to 0); emit `PlayerOustedEffect`.
2. Collect all players with `pool ≤ 0` after this resolution step.
3. For each such player P: award predator of P one VP. If P's predator is also being ousted in the same step, withhold the 6-pool award to the predator.
4. If exactly one non-ousted player remains, award +1 VP to that survivor; emit `GameCompletedEffect`.
5. If zero non-ousted players remain (last two ousted simultaneously), emit `GameCompletedEffect` with no survivor VP.

`DeclareTimeout` follows a separate path: award 0.5 VP to each surviving player; last survivor gets +1 VP instead; determine Game Win by ≥ 2 VP and sole VP leader; emit `GameCompletedEffect`.

### Withdrawal state

`PlayerData.withdrawalDeclared: boolean` (new field). Withdrawal lifecycle:
- `AnnounceWithdrawal`: set flag; validate UNLOCK phase and library exhaustion.
- At each subsequent UNLOCK phase entry, check whether conditions are still met: if the player spent pool/blood or had minions enter combat since last UNLOCK, auto-cancel via `CancelWithdrawal`.
- `ConfirmWithdrawal`: award 1 VP; remove player from seating order without triggering predator-VP or pool transfer.

### Named counter types

`AddCounter` / `RemoveCounter` are generic today. Named counters (Corruption, Disease, Surge, Oath, Riddle, etc.) need a `counterType: String` field added to the command and a per-type counter map on `CardData`. Corruption has cross-player ownership semantics — it belongs to the placing Methuselah, not the card's controller. Aye and Orun (Laibon conviction cards) are attached master cards, not counters; the attachment mechanism already works.

### Blood capacity overflow

In rules-enforced mode, `AddCounter` should cap `counters` at `capacity` when `capacity > 0` and the card is `VAMPIRE` or `IMBUED`. The same cap applies in `InfluenceCard` and `RescueFromTorpor`. Excess blood returns to the bank (no effect on other state).

### Minion traits

`CardData.infernal` exists. The full trait model (Scarce, Slave, Sterile, Blood Cursed, etc.) and enforcement hooks are in [Card Keywords](./card-keywords.md). Game-state enforcement during unlock, influence, action declaration, and diablerie depends on those parsed fields being available.

---

## WebSocket Communication

The game WebSocket endpoint is at `/ws/game/{gameId}` and requires the `USER` role.

### Inbound message types

| Type           | Description                                |
|----------------|--------------------------------------------|
| `CHAT`         | Send a chat message                        |
| `REACTION`     | React to a message with an emoji           |
| `GAME_COMMAND` | Execute a game command                     |

### Outbound message types

| Type             | Description                                                       |
|------------------|-------------------------------------------------------------------|
| `CHAT`           | A new chat message                                                |
| `HISTORY`        | Full chat history (sent on connect)                               |
| `REACTION`       | An emoji reaction to a chat message                               |
| `GAME_STATE`     | Updated game state after a command (viewer-filtered)              |
| `GAME_SNAPSHOT`  | Full game state snapshot (sent on connect, after HISTORY)         |
| `ERROR`          | Error from a failed command                                       |

On connection, the server immediately sends `HISTORY` followed by `GAME_SNAPSHOT`. After any command, the updated `GAME_STATE` is broadcast to all connected clients.
