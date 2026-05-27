# Game State

## Overview
The game state tracks everything needed to play a game of VTES in JOL. It lives in memory (in-process `ConcurrentHashMap`) and is persisted as a JSON snapshot in the `game_state` column of the `game` table after every command. On server restart, active games are rehydrated from that snapshot.

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
Each player's turn cycles through phases in order:

```
UNLOCK → MASTER → MINION → INFLUENCE → DISCARD
```

`AdvancePhase` moves to the next phase. Advancing past `DISCARD` triggers `NextTurn`, which:
- Skips any ousted players.
- Sets the new current player.
- Resets phase to `UNLOCK`.
- Auto-unlocks all cards belonging to the new current player.

### Transfer budget
`transfersRemaining` is a game-level integer tracking how many influence transfers the current player has left this turn. It is set when `AdvancePhase` enters `INFLUENCE`, using the formula:
- Round 1: `min(seat, 4)` (seat 1 → 1 Transfer, seat 2 → 2 Transfer, seat 3 → 3 Transfer, seat 4+ → 4 Transfer)
- Round 2+: always 4

It is reset to 0 on `NextTurn`. It is sent to clients via `GameStateDto.transfersRemaining`.

### Impulse window (phase-level)
Every time a new phase begins — either via `AdvancePhase` or `NextTurn` — the server **automatically opens an impulse window** (`ImpulseState`) for the current player using an `UNDIRECTED` context. The current player starts as both the `actingPlayer` and `currentImpulseHolder`. The pass order is built from the predator–prey ring (the same as a manually opened undirected window).

While an impulse window is active, **game action commands are gated**: only the player whose name matches `currentImpulseHolder` may execute them. Commands that are exempt from this gate (i.e. always allowed regardless of impulse):

| Command                                                                     | Reason                                               |
|-----------------------------------------------------------------------------|------------------------------------------------------|
| `AdvancePhase` / `NextTurn`                                                 | Phase management — current player can always advance |
| `OpenImpulseWindow` / `PassImpulse` / `ClaimImpulse` / `CloseImpulseWindow` | Impulse system itself                                |
| `SetGameNotes` / `SetCardNotes` / `SetChoice`                               | Administrative / meta                                |

When `AdvancePhase` is called, any open window is replaced by a fresh window for the incoming phase's current player. Manually closing the window (✕ button) removes gating for that phase; the window reopens automatically on the next phase advance.

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

| Region              | Owner visible | Others visible | Notes                                     |
|---------------------|:-------------:|:--------------:|-------------------------------------------|
| `READY`             |       ✓       |       ✓        | In-play minions and locations             |
| `UNCONTROLLED`      |       ✓       |       ✗        | Face-down crypt cards not yet influenced  |
| `ASH_HEAP`          |       ✓       |       ✓        | Discard pile                              |
| `HAND`              |       ✓       |       ✗        | Current hand                              |
| `LIBRARY`           |       ✗       |       ✗        | Library deck (face-down to everyone)      |
| `CRYPT`             |       ✗       |       ✗        | Crypt deck (face-down to everyone)        |
| `TORPOR`            |       ✓       |       ✓        | Torpored vampires                         |
| `REMOVED_FROM_GAME` |       ✓       |       ✓        | Cards removed from play                   |
| `RESEARCH`          |       ✓       |       ✗        | Research Area (face-down to others)       |

**Visibility and UUID privacy:**
- Cards in regions visible to the viewer are transmitted in full.
- Cards in regions hidden to the viewer are **omitted entirely** from the card map — no UUID is sent to non-owners.
- The card's **owner** still receives a stub for their own hidden cards (e.g. hand, library), which carries `id`, `regionId`, `ownerName`, `parentId`, `locked`, `counters`, `notes`, and `childCardIds`.
- For the `UNCONTROLLED` region specifically, non-owning viewers receive **positional slot data** (`slots`) on the `RegionState` in place of card UUIDs. Each slot has `{index, counters, locked, childCount}`, allowing opponents to observe blood counter amounts on face-down vampires (as per the VTES influence rules) without learning the card's identity.
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

**Race condition note:** Positions are resolved at command-execution time. In the rare case that another command has changed card order since the client observed the state, the command is silently no-ops (position out of range returns null).

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
| Command            | Fields (besides `gameId`)                                 | Source → Target                                          | Description                                                                                                                                    | Phase       |
|--------------------|-----------------------------------------------------------|----------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| `PlayCard`         | `ref`, `targetPlayerName`, `targetRegionType`             | `HAND` or `RESEARCH` → any (default: owner `ASH_HEAP`)   | Move a card to a target region; discards if no target given                                                                                    |             |
| `MoveCard`         | `ref`, `targetPlayerName`, `targetRegionType`, `position` | any → any                                                | Move a card to any region at a given position                                                                                                  |             |
| `AttachCard`       | `ref`, `targetRef`                                        | any → child of target card (typically `READY`)           | Attach a card to another card (e.g., retainer to vampire)                                                                                      |             |
| `InfluenceCard`    | `ref`                                                     | `UNCONTROLLED` → owner `READY`                           | Move a fully influenced vampire/imbued to the Ready region. Actor is the current player, `counters ≥ capacity > 0`. Silently no-ops otherwise. | `INFLUENCE` |
| `MoveToCrypt`      | `ref`                                                     | `UNCONTROLLED` → owner `CRYPT` (bottom, clears counters) | Return a vampire to Crypt (influence cancelled)                                                                                                |             |
| `MoveToTorpor`     | `ref`                                                     | `READY` → owner `TORPOR`                                 | Move a minion to Torpor                                                                                                                        |             |
| `RescueFromTorpor` | `ref`                                                     | `TORPOR` → owner `READY`                                 | Move a minion from Torpor to Ready                                                                                                             |             |
| `BurnMinion`       | `ref`                                                     | `READY` or `TORPOR` → owner `ASH_HEAP`                   | Remove a minion from play entirely                                                                                                             |             |

### Card state
| Command            | Fields (besides `gameId`) | Valid `ref` region(s)         | Description                           | Phase    |
|--------------------|---------------------------|-------------------------------|---------------------------------------|----------|
| `LockCard`         | `ref`                     | any                           | Lock (tap) a card                     | Any      |
| `UnlockCard`       | `ref`                     | any                           | Unlock (untap) a card                 | Any      |
| `UnlockAll`        | `playerName`              | — (affects `READY`, `TORPOR`) | Unlock all in-play cards for a player | 'UNLOCK' |
| `AddCounter`       | `ref`, `amount`           | any                           | Increment a card's counter            | Any      |
| `RemoveCounter`    | `ref`, `amount`           | any                           | Decrement a card's counter (floor 0)  | Any      |
| `SetCardNotes`     | `ref`, `notes`            | any                           | Set freeform notes on a card          | Any      |
| `ContestCard`      | `ref`                     | any                           | Mark a card as contested              | Any      |
| `ClearContestCard` | `ref`                     | any                           | Clear the contested flag              | Any      |
| `SetTitle`         | `ref`, `title`            | any (typically `READY`)       | Set or clear a vampire's title        | Any      |

### Player state
| Command         | Fields (besides `gameId`) | Valid `ref` region(s)             | Description                                                                                                                                                                                                                               | Phase       |
|-----------------|---------------------------|-----------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| `SetPool`       | `playerName`, `amount`    | —                                 | Set a player's pool to an absolute value                                                                                                                                                                                                  |             |
| `TransferBlood` | `ref`, `amount`           | `READY`, `TORPOR`, `UNCONTROLLED` | Transfer blood between controller's pool and a card. For `UNCONTROLLED` cards: restricted to the current player only; pool → card costs 1 transfer/blood; card → pool costs 2 transfers/blood. Silently no-ops if budget is insufficient. | `INFLUENCE` |
| `GainEdge`      | `playerName`              | —                                 | Award the edge to a player                                                                                                                                                                                                                |             |
| `OustPlayer`    | `playerName`              | —                                 | Mark a player as ousted                                                                                                                                                                                                                   |             |
| `SetChoice`     | `playerName`, `choice`    | —                                 | Set a player's choice flag                                                                                                                                                                                                                |             |
| `ReverseOrder`  | —                         | —                                 | Toggle the order-of-play reversal flag                                                                                                                                                                                                    |             |

### Game state
| Command         | Description                       |
|-----------------|-----------------------------------|
| `SetGameNotes`  | Set freeform notes on the game    |

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