# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
* When creating new classes or components create tests or story files to confirm functionality
* Update docs when mechanics or list items are changed / completed
* When documenting, make sure all markdown documents are formatted correctly

## Logical Model
JOL is a representation of the Vampire: The Eternal Struggle card game.  As such it tries to mimic the logic and constraints that apply in a real-world game.

Documentation is split into two folders:
- **[VTES Rules](docs/rules/README.md)** — tabletop game rules any VTES player would recognise
- **[JOL Implementation](docs/implementation/README.md)** — data structures, commands, import formats, and gap analysis specific to the online client

Each topic has a paired rules doc and implementation doc. When editing either side, review and update the corresponding doc on the other side.

### Documentation Map

| VTES Rules                                            | JOL Implementation                                                                           |
|-------------------------------------------------------|----------------------------------------------------------------------------------------------|
| [Deck Building](docs/rules/deck-building.md)          | [Deck Building](docs/implementation/deck-building.md), [Cards](docs/implementation/cards.md) |
| [Game Flow](docs/rules/game-flow.md)                  | [Game State](docs/implementation/game-state.md)                                              |
| [Actions](docs/rules/actions.md)                      | [Actions](docs/implementation/actions.md)                                                    |
| [Blocking](docs/rules/blocking.md)                    | [Blocking](docs/implementation/blocking.md)                                                  |
| [Referendums](docs/rules/referendums.md)              | [Referendums](docs/implementation/referendums.md)                                            |
| [Combat](docs/rules/combat.md)                        | [Combat](docs/implementation/combat.md)                                                      |
| [Card Timing and Card Types](docs/rules/card-play.md) | [Card Play](docs/implementation/card-play.md)                                                |
| [Tournament](docs/rules/tournament.md)                | [Tournament Lobby](docs/implementation/tournament-lobby.md)                                  |
| —                                                     | [Game Lobby](docs/implementation/game-lobby.md)                                              |
| —                                                     | [Game Modes](docs/implementation/game-modes.md)                                              |
| —                                                     | [Board Layouts](docs/implementation/board-layouts.md)                                        |
| —                                                     | [Chat System](docs/implementation/chat.md)                                                   |
| —                                                     | [Mechanics Gaps](docs/implementation/mechanics-gaps.md)                                      |

## Commands

### Backend (Quarkus / Maven)

```bash
./mvnw quarkus:dev          # Dev mode with live reload; Dev UI at http://localhost:8080/q/dev/
./mvnw test                 # Run all backend tests
./mvnw test -Dtest=GameControllerTest              # Run a single test class
./mvnw test -Dtest=GameControllerTest#createGame   # Run a single test method
./mvnw package              # Build JAR (output: target/quarkus-app/)
```

### Frontend (React / Vite — run from `src/main/webui/`)

```bash
npm run dev          # Vite dev server on port 5173
npm run build        # TypeScript check then Vite build to dist/
npm run lint         # ESLint
npm run storybook    # Storybook on port 6006 (also runs component tests via vitest)
```

## Architecture
JOL is a Java quarkus + quinoa application with a React / Typescript / TailwindCSS front end.

See detailed architecture guide at [Architecture Document](docs/architecture/README.md)

### Backend Test Pattern

Tests use `@QuarkusTest` + `@TestSecurity(user="...", roles={...})` with `rest-assured` for HTTP assertions. DB state is managed with `@Transactional` setup/teardown methods.

### Card Data

Card definitions are loaded from `vtescrypt.csv` and `vteslib.csv` in `src/main/resources/` (and optionally `csv/` at the project root) via `CardRegistry` on startup. `CardSearchService` provides fuzzy search over the registry. The `names_nouns.txt`, `names_adjectives.txt`, and `names_verbs.txt` resources power the `GameToken` random-name generator. Deck format validation is handled by `DeckValidatorService` with per-format validators (`StandardDeckValidator`, `DuelDeckValidator`, `V5DeckValidator`).
