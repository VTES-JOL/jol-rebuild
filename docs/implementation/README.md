# JOL Implementation

JOL-specific data structures, commands, WebSocket protocols, import formats, and gap analysis. These documents describe how VTES rules are represented and enforced in the online client.

For the game rules themselves, see [VTES Rules](../rules/README.md).

---

## Documents

| Document                                  | Description                                                                                                                 |
|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| [Cards](./cards.md)                       | CSV data sources, name disambiguation algorithm, search and display rules                                                   |
| [Deck Building](./deck-building.md)       | Import formats (JOL text, KRCG JSON), summary format, and validation service                                                |
| [Game Lobby](./game-lobby.md)             | Game lifecycle (OPEN→ACTIVE), registration rules, visibility, and WebSocket broadcasts                                      |
| [Game Modes](./game-modes.md)             | `GameData.rulesEnforced`, command availability matrix, `GameEffect` types, and CQRS notes                                   |
| [Game State](./game-state.md)             | In-memory state model, `GameStateDto`, `CardRef` addressing, all commands, WebSocket protocol, and phase/state gap analysis |
| [Actions](./actions.md)                   | Action declaration protocol, `PendingActionState`, NRA, action resolution gaps, and proposed state                          |
| [Blocking](./blocking.md)                 | Block attempt enforcement, stealth/intercept tracking, directed/undirected eligibility, and redirects                       |
| [Referendums](./referendums.md)           | Referendum engine gaps, vote sources, Prisci ballots, blood hunt, and proposed commands                                     |
| [Card Play](./card-play.md)               | Phase gating, card lifecycle, limited effects, and missing enum values                                                      |
| [Timing Windows](./timing-windows.md)     | Sequential action, combat, diablerie, referendum, and blood hunt play windows; includes the unified action state diagram    |
| [Card Keywords](./card-keywords.md)       | Keyword parsing, proposed `CardData` fields, enforcement hooks, and non-goals                                               |
| [Combat](./combat.md)                     | Combat system gaps, proposed commands, diablerie resolution                                                                 |
| [Board Layouts](./board-layouts.md)       | Strip, Table, and Text board layouts; region visibility rules and drag-and-drop                                             |
| [Chat](./chat.md)                         | WebSocket protocol, DB schema, command log integration, and configuration                                                   |
| [Tournament Lobby](./tournament-lobby.md) | Tournament lifecycle, seating administration, activation constraints, and game creation                                     |
| [Mechanics Gaps](./mechanics-gaps.md)     | Cross-reference index, already-implemented summary, frontend gaps, and implementation priority                              |
