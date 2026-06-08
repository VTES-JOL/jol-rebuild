# JOL Implementation

JOL-specific data structures, commands, WebSocket protocols, import formats, and gap analysis. These documents describe how VTES rules are represented and enforced in the online client.

For the game rules themselves, see [VTES Rules](../rules/README.md).

---

## Documents

| Document | Description |
|---|---|
| [Cards](./cards.md) | CSV data sources, name disambiguation algorithm, search and display rules |
| [Deck Building](./deck-building.md) | Import formats (JOL text, KRCG JSON), summary format, and validation service |
| [Game Lobby](./game-lobby.md) | Game lifecycle (OPEN→ACTIVE), registration rules, visibility, and WebSocket broadcasts |
| [Game Modes](./game-modes.md) | `GameData.rulesEnforced`, command availability matrix, `GameEffect` types, and CQRS notes |
| [Game State](./game-state.md) | In-memory state model, `GameStateDto`, `CardRef` addressing, all commands, and WebSocket protocol |
| [Card Play](./card-play.md) | Implementation status for phase enforcement and missing enum values |
| [Combat](./combat.md) | Implementation status for `pendingCombat` and proposed combat commands |
| [Board Layouts](./board-layouts.md) | Strip, Table, and Text board layouts; region visibility rules and drag-and-drop |
| [Chat](./chat.md) | WebSocket protocol, DB schema, command log integration, and configuration |
| [Tournament Lobby](./tournament-lobby.md) | Tournament lifecycle, seating administration, activation constraints, and game creation |
| [Mechanics Gaps](./mechanics-gaps.md) | Gap analysis between VTES rules and current JOL enforcement, with proposed commands |
