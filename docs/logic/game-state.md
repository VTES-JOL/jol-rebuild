# Game State

## Overview
The game state tracks everything needed to play a game of VTES in JOL. It lives in memory (in-process `ConcurrentHashMap`) and is persisted as a JSON snapshot in the `game_state` column of the `game` table after every command. On server restart, active games are rehydrated from that snapshot.

State is never sent raw to clients. A viewer-filtered projection (`GameStateDto`) is produced for each player, hiding information they cannot legitimately see.

---

## Initialization
When a game transitions from `OPEN` to `ACTIVE`, `GameInitService` builds the initial `GameData`:

- Player order is **randomized** at init time, then fixed for the life of the game.
- The predator–prey circle is derived from player order (circular, wrapping last → first).
- Each player starts with **pool = 30**.
- The **crypt** is shuffled; the top **4 cards** are dealt face-down to the player's Uncontrolled region.
- The **library** is shuffled; the top **7 cards** are dealt to the player's Hand.
- Starting phase is `UNLOCK`; starting turn is `"1.1"`.
- The first player in the randomized order takes the first turn.

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

### Edge
The **edge** is a single `PlayerData` reference indicating which player currently holds it. It is transferred via the `GainEdge` command and starts as unset.

### Order of play
A boolean flag `orderOfPlayReversed` can be toggled via `ReverseOrder`. When true, the game is progressing in reverse seating order.

---

## Player State
Each player has the following tracked values:

| Field           | Type    | Default | Description                              |
|-----------------|---------|---------|------------------------------------------|
| `pool`          | int     | 30      | Current pool count                       |
| `victoryPoints` | float   | 0       | Victory points accumulated               |
| `ousted`        | boolean | false   | Whether the player has been ousted       |
| `prey`          | Player  | —       | The next player in seat order            |
| `predator`      | Player  | —       | The previous player in seat order        |
| `notes`         | String  | —       | Freeform notes visible to the player     |
| `choice`        | String  | —       | Player choice flag (used for game events)|

---

## Regions
Each player has exactly one instance of every region type. Region IDs are formatted as `"{playerName}-{regionType}"`.

| Region              | Owner visible | Others visible | Notes                                     |
|---------------------|:-------------:|:--------------:|-------------------------------------------|
| `READY`             | ✓             | ✓              | In-play minions and locations             |
| `UNCONTROLLED`      | ✓             | ✗              | Face-down crypt cards not yet influenced  |
| `ASH_HEAP`          | ✓             | ✓              | Discard pile                              |
| `HAND`              | ✓             | ✗              | Current hand                              |
| `LIBRARY`           | ✗             | ✗              | Library deck (face-down to everyone)      |
| `CRYPT`             | ✗             | ✗              | Crypt deck (face-down to everyone)        |
| `TORPOR`            | ✓             | ✓              | Torpored vampires                         |
| `REMOVED_FROM_GAME` | ✓             | ✓              | Cards removed from play                   |
| `RESEARCH`          | ✓             | ✗              | Research Area (face-down to others)       |

Cards within a hidden region are transmitted as **stubs** — only `id`, `regionId`, `ownerName`, `parentId`, `locked`, `counters`, and `notes` are included. Full card details are omitted.

Cards in `LIBRARY` and `CRYPT` are hidden even to their owner; `regionId` and count are sent but not `cardId` or name.

`PLAYABLE_REGIONS` (from which cards can be played): `HAND`, `RESEARCH`.  
`IN_PLAY_REGIONS` (on the board): `READY`, `TORPOR`.

---

## Card State
Every card instance has a unique UUID (`id`). The card template reference is `cardId` (matching the CSV registry).

### Always transmitted
| Field        | Description                                              |
|--------------|----------------------------------------------------------|
| `id`         | Unique instance UUID                                     |
| `regionId`   | ID of the region this card is in                         |
| `ownerName`  | Player who owns this card                                |
| `parentId`   | UUID of parent card if this card is attached             |
| `childCardIds` | UUIDs of cards attached to this card                   |
| `locked`     | Whether the card is tapped/locked                        |
| `counters`   | Counter value on the card                                |
| `notes`      | Freeform card notes                                      |

### Transmitted only when visible to the viewer
| Field          | Description                                           |
|----------------|-------------------------------------------------------|
| `cardId`       | Template ID (links to card registry)                  |
| `name`         | Card name as printed                                  |
| `type`         | `CardType` (see below)                                |
| `contested`    | Whether the card is contested                         |
| `votes`        | Vote count (for political cards / vampires)           |
| `title`        | Vampire title                                         |
| `advanced`     | Whether the vampire is the advanced version           |
| `capacity`     | Vampire blood capacity                                |
| `clan`         | Vampire clan                                          |
| `sect`         | Vampire sect                                          |
| `path`         | Vampire path (for non-Humanity vampires)              |
| `disciplines`  | List of discipline strings                            |
| `controllerName` | Player currently controlling the card (may differ from owner) |
| `minion`       | Whether the card is a minion (vampires, allies, imbued) |
| `unique`       | Whether the card is unique                            |

### Card types
`VAMPIRE`, `IMBUED`, `MASTER`, `ACTION`, `MODIFIER`, `REACTION`, `COMBAT`, `ALLY`, `RETAINER`, `POLITICAL`, `EQUIPMENT`, `EVENT`, `LOCATION`, `NONE`

---

## Commands
Commands are sent via WebSocket as `GAME_COMMAND` messages. Each command carries the `gameId`. The server applies the command, persists the snapshot, then broadcasts the updated state to all connected clients.

Commands are executed under a per-game lock, so concurrent commands for the same game are serialized.

### Turn / phase
| Command        | Description                                                  |
|----------------|--------------------------------------------------------------|
| `AdvancePhase` | Move to the next phase; wraps to next turn after DISCARD     |
| `NextTurn`     | Advance to the next non-ousted player's turn directly        |

### Deck operations
| Command          | Description                                                |
|------------------|------------------------------------------------------------|
| `DrawCard`       | Draw `count` cards from library to hand                    |
| `ShuffleLibrary` | Shuffle the actor's library                                |
| `ShuffleCrypt`   | Shuffle the actor's crypt                                  |
| `DiscardCard`    | Move a card from hand to ash heap                          |

### Card movement
| Command             | Description                                                   |
|---------------------|---------------------------------------------------------------|
| `PlayCard`          | Move a card to a target region; discards if no target given   |
| `MoveCard`          | Move a card to any region at a given position                 |
| `AttachCard`        | Attach a card to another card (e.g., retainer to vampire)     |
| `MoveToReady`       | Move a card to the owner's Ready region                       |
| `MoveToCrypt`       | Move a card to the owner's Crypt (bottom)                     |
| `MoveToTorpor`      | Move a minion to Torpor                                       |
| `RescueFromTorpor`  | Move a minion from Torpor to Ready                            |
| `BurnMinion`        | Remove a minion from play entirely (to ash heap)              |
| `InfluenceVampire`  | Move a vampire from Uncontrolled to Ready                     |

### Card state
| Command          | Description                                               |
|------------------|-----------------------------------------------------------|
| `LockCard`       | Lock (tap) a card                                         |
| `UnlockCard`     | Unlock (untap) a card                                     |
| `UnlockAll`      | Unlock all cards for a player                             |
| `AddCounter`     | Increment a card's counter                                |
| `RemoveCounter`  | Decrement a card's counter                                |
| `SetCardNotes`   | Set freeform notes on a card                              |
| `ContestCard`    | Mark a card as contested                                  |
| `UncontestCard`  | Clear the contested flag                                  |
| `SetTitle`       | Set or clear a vampire's title                            |

### Player state
| Command         | Description                                                |
|-----------------|------------------------------------------------------------|
| `SetPool`       | Set a player's pool to an absolute value                   |
| `TransferPool`  | Transfer pool between players                              |
| `GainEdge`      | Award the edge to a player                                 |
| `OustPlayer`    | Mark a player as ousted                                    |
| `SetChoice`     | Set a player's choice flag                                 |
| `ReverseOrder`  | Toggle the order-of-play reversal flag                     |

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

On connect, the server immediately sends `HISTORY` followed by `GAME_SNAPSHOT`. After any command, the updated `GAME_STATE` is broadcast to all connected clients.