# Chat System

> No corresponding rules document — chat is a JOL-specific feature.

## Overview

JOL has two independent chat contexts sharing a single `ChatService`:

| Context | WebSocket path      | `gameId` in DB |
|---------|---------------------|----------------|
| Lobby   | `/ws/lobby`         | `null`         |
| In-game | `/ws/game/{gameId}` | the game UUID  |

Both contexts support the same features: threaded replies, emoji reactions, and history-on-connect. The lobby also receives `LOBBY_UPDATE` events for game registration changes.

---

## Persistence

Messages are stored in two tables:

**`chat_messages`**

| Column       | Type      | Notes                             |
|--------------|-----------|-----------------------------------|
| `id`         | UUID      | Primary key                       |
| `game_id`    | varchar   | `null` for lobby messages         |
| `sender`     | varchar   | Username or `"SYSTEM"`            |
| `content`    | TEXT      |                                   |
| `timestamp`  | timestamp |                                   |
| `reply_to_id` | UUID FK  | Points to another `chat_messages` row; `null` when not a reply |

**`chat_message_reactions`**

| Column       | Type    | Notes                                             |
|--------------|---------|---------------------------------------------------|
| `id`         | UUID    | Primary key                                       |
| `message_id` | UUID FK |                                                   |
| `sender`     | varchar |                                                   |
| `emoji`      | varchar |                                                   |
|              |         | Unique constraint on `(message_id, sender, emoji)` |

---

## WebSocket Protocols

### Lobby — `/ws/lobby`

Requires `USER` role. Uses `ChatMessageDto` as the JSON envelope directly.

**Client → Server**

| `type`     | Fields required              | Description                              |
|------------|------------------------------|------------------------------------------|
| `CHAT`     | `content`, optional `replyToId` | Send a chat message                   |
| `REACTION` | `id`, `emoji`                | Toggle an emoji reaction on a message   |

**Server → Client**

| `type`         | Fields              | Description                                                |
|----------------|---------------------|------------------------------------------------------------|
| `HISTORY`      | `history[]`         | Sent on connect — recent messages in ascending order       |
| `CHAT`         | message fields      | Broadcast to all lobby sessions when a message is posted   |
| `REACTION`     | `id`, `reactions[]` | Broadcast to all lobby sessions after a reaction toggle    |
| `LOBBY_UPDATE` | `gameId`            | Broadcast when a player registers for or leaves a game     |
| `ERROR`        | `error`             | Sent only to the connection that caused the error          |

### In-Game — `/ws/game/{gameId}`

Requires `USER` role. Uses `GameMessageDto` as the envelope, which multiplexes chat and game commands on a single connection.

**Client → Server**

| `type`         | Fields required                           | Description                            |
|----------------|-------------------------------------------|----------------------------------------|
| `CHAT`         | `content`, optional `replyToId`           | Send a chat message                    |
| `REACTION`     | `id`, `emoji`                             | Toggle an emoji reaction on a message  |
| `GAME_COMMAND` | `command` (a `GameCommand` JSON object)   | Execute a game command                 |

**Server → Client**

| `type`          | Fields              | Description                                                      |
|-----------------|---------------------|------------------------------------------------------------------|
| `HISTORY`       | `history[]`         | Sent on connect — recent messages in ascending order             |
| `GAME_SNAPSHOT` | `state`             | Full game state (viewer-filtered) — sent on connect after HISTORY |
| `CHAT`          | message fields      | Broadcast to all game sessions when a message is posted          |
| `REACTION`      | `id`, `reactions[]` | Broadcast to all game sessions after a reaction toggle           |
| `GAME_STATE`    | `state`             | Viewer-filtered game state — broadcast after every command       |
| `ERROR`         | `error`             | Sent only to the connection that triggered the error             |

---

## Message Structure

### Outbound `CHAT` message

```json
{
  "type": "CHAT",
  "id": "<uuid>",
  "sender": "alice",
  "content": "Parity shift to 6 pool.",
  "timestamp": "2025-05-18T14:32:01.123Z",
  "replyTo": null,
  "reactions": []
}
```

### `replyTo` (when the message is a reply)

```json
"replyTo": {
  "id": "<uuid of original message>",
  "sender": "bob",
  "content": "Calling a vote…"
}
```

The `content` in `replyTo` is truncated to 100 characters (with `…` appended) if the original is longer. The full original content is always stored in the database.

### Outbound `REACTION` message

```json
{
  "type": "REACTION",
  "id": "<message uuid>",
  "reactions": [
    { "emoji": "👍", "senders": ["alice", "charlie"] },
    { "emoji": "😂", "senders": ["bob"] }
  ]
}
```

`reactions` contains the full updated reaction state for the message, not just the delta.

### `HISTORY` packet

```json
{
  "type": "HISTORY",
  "history": [ "<CHAT message objects>" ]
}
```

History messages include their `reactions` list, populated at load time.

---

## On Connect

On WebSocket open, the server immediately sends:

1. A single `HISTORY` packet containing the most recent `historyLimit` messages (default **50**), ordered oldest-to-newest.
2. (Game channel only) A `GAME_SNAPSHOT` with the viewer-filtered game state.

The two packets are always sent in that order.

---

## Sending a Message

Validation rules applied before saving:

- `content` must be non-blank after trimming.
- `content` must not exceed `maxContentLength` characters (default **4000**).
- If `replyToId` is provided, a message with that ID must exist in the **same game** (or lobby). Cross-context replies are rejected with `ERROR`.

Passing validation: the message is persisted and broadcast to all connected sessions in the same context.

---

## Replies

A client sends `replyToId` set to the UUID of the message being replied to. The server validates that the referenced message belongs to the same game (or lobby), then stores the link. Every client receives the message with a `replyTo` snapshot embedded.

---

## Reactions

A client sends `type: REACTION` with `id` (message UUID) and `emoji` (any string, typically a Unicode emoji). The server toggles the reaction:

- If the sender has **not** reacted with that emoji on that message → reaction is **added**.
- If the sender **has** already reacted with that emoji → reaction is **removed**.

The uniqueness constraint on `(message_id, sender, emoji)` enforces that a sender can only hold one instance of each emoji per message. The updated full reaction set is broadcast to all sessions.

---

## Command Log Integration

When a `GAME_COMMAND` message is processed and the command produces a log entry, the log is saved as a `CHAT` message (sent by the executing player) and broadcast alongside the `GAME_STATE` update. This means game actions appear inline in the chat history.

Every command execution produces two tiers of log entries:

1. **Command intent** — describes what was attempted (e.g. "Alice declared a bleed action"). Produced by the handler and saved as a structured `CommandLogData` entry. Some commands (e.g. `LockCard`, `UnlockCard`, `SetCardNotes`, `SetChoice`) produce no intent log.

2. **Effect log** — one message per state change applied (e.g. "Minion X is now locked", "Alice lost 2 pool (now 10)"). Generated by `GameEffectApplicator` and broadcast as `system`-sender messages immediately after the intent log. Hidden-region movements (card drawn to hand, library shuffle) do not generate visible effect messages.

Commands that produce no log entries at all: `SetCardNotes`, `SetChoice`.

---

## Lobby System Messages

The `LobbyChatBroadcaster` can inject system-generated messages into the lobby chat with `sender = "SYSTEM"`. These are persisted identically to player messages and appear in history.

`LOBBY_UPDATE` events (type `LOBBY_UPDATE` with a `gameId` field) are **not** persisted — they are transient signals to clients to refresh the registration state of the named game.

---

## Configuration

| Property                  | Default | Description                                 |
|---------------------------|---------|---------------------------------------------|
| `jol.chat.historyLimit`   | `50`    | Number of messages sent in the HISTORY packet on connect |
| `jol.chat.maxContentLength` | `4000` | Maximum character length of a message      |

---

## Pagination (REST)

Chat history is also accessible via REST for display in non-WebSocket contexts:

```
GET /api/games/{id}/messages?page=0&limit=50
```

- `page` — zero-based page index (default `0`)
- `limit` — messages per page (default `50`, capped at `200`)
- Results are returned in **ascending** timestamp order within each page.
- Pages are taken from the newest messages backward, then re-ordered ascending for display — so `page=0` is the most recent `limit` messages, oldest-first.
