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

When updating game rules documentation in `docs/rules/`, review the corresponding docs in `docs/implementation/` and update any affected gap analysis, command descriptions, or implementation status notes.

### VTES Rules
- [Deck Building](docs/rules/deck-building.md)
- [Game Flow](docs/rules/game-flow.md)
- [Card Play](docs/rules/card-play.md)
- [Combat](docs/rules/combat.md)
- [Tournament](docs/rules/tournament.md)

### JOL Implementation
- [Cards Import and Searching](docs/implementation/cards.md)
- [Deck Building and Importing](docs/implementation/deck-building.md)
- [Game Lobby](docs/implementation/game-lobby.md)
- [Tournament Lobby](docs/implementation/tournament-lobby.md)
- [Game State](docs/implementation/game-state.md)
- [Board Layouts](docs/implementation/board-layouts.md)
- [Chat System](docs/implementation/chat.md)
- [Mechanics Gaps](docs/implementation/mechanics-gaps.md)
- [Card Play](docs/implementation/card-play.md)
- [Combat](docs/implementation/combat.md)
- [Game Modes](docs/implementation/game-modes.md)

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