# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Infrastructure

```bash
docker-compose up -d   # Start PostgreSQL (required for backend)
```

The `.env` file at the project root provides `DB_USER`, `DB_PASS`, and `DB_NAME` (defaults: `jol`/`jol`/`jol`).

## Architecture

JOL Quarkus is a multiplayer trading card game lobby platform. Players register, create/join games with different formats and visibility settings, manage decks, and communicate via real-time chat.

### Backend — `src/main/java/net/deckserver/jol/`

```
controller/     REST endpoints (GameController, UserController, CardController)
ws/             WebSocket handlers (GameWebSocket, LobbyWebSocket)
entity/         JPA/Panache entities (User, Game, Registration, Deck, ChatMessage, …)
services/       Business logic (ChatService, GameService, CardService, …)
dto/            Request/response DTOs
enums/          Status, Role, Visibility, GameFormat
config/         Application configuration beans
converters/     JPA attribute converters
```

REST and WebSocket security use Quarkus form-based auth with JPA-backed user store. Roles: `USER`, `ADMIN`. WebSocket paths (`/ws/*`) require authentication.

Database is PostgreSQL with Hibernate ORM Panache. Flyway handles migrations in production; in dev mode Quarkus drops/recreates schema on startup.

### Frontend — `src/main/webui/src/`

```
app/        Router setup (React Router 7) and App.tsx
features/   Vertical slices: auth, chat, game, lobby, nav
shared/     Reusable components, utilities, types
hooks/      Custom React hooks (useAuthContext, etc.)
stories/    Storybook stories doubling as vitest component tests
```

Built with React 19, TypeScript, Tailwind CSS 4, and Vite. The Quinoa Maven plugin bundles the frontend into the backend JAR at build time so the backend serves the SPA in production.

### Frontend ↔ Backend

- **REST**: `/games`, `/user/*` — fetched via standard `fetch` with session cookies
- **WebSockets**: `/ws/game/{gameId}` (in-game chat/events) and `/ws/lobby` (lobby-wide events) using Quarkus WebSockets Next
- **Dev proxy**: Vite proxies API/WebSocket calls to `localhost:8080` in dev mode; CORS is enabled on the backend for `localhost:5173`

### Backend Test Pattern

Tests use `@QuarkusTest` + `@TestSecurity(user="...", roles={...})` with `rest-assured` for HTTP assertions. DB state is managed with `@Transactional` setup/teardown methods.

### Card Data

Card definitions are loaded from CSV files in `src/main/resources/csv/` and `csv/` at the project root via `CardService`. The `names_nouns.txt`, `names_adjectives.txt`, and `names_verbs.txt` resources power the `GameToken` random-name generator.