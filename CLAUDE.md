# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
* When creating new classes or components create tests or story files to confirm functionality

## Logical Model
JOL is a representation of the Vampire: The Eternal Struggle card game.  As such it tries to mimic the logic and constraints that apply in a real-world game.

Below is the detailed documentation for the logical constraints each domain model works under:
- [Cards Import and Searching](/docs/logic/cards.md)
- [Deck Building and Importing](/docs/logic/deck-building.md)
- [Game lobby](docs/logic/game-lobby.md)
- [Tournament lobby](docs/logic/tournament-lobby.md)
- [Game State](docs/logic/game-state.md)
- [Board Layouts](docs/logic/board-layouts.md)
- [Chat System](docs/logic/chat.md)

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