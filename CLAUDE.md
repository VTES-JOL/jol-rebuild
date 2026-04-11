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
controller/     REST endpoints (GameController, UserController, CardController, DeckController)
ws/             WebSocket handlers (GameWebSocket, LobbyWebSocket)
entity/         JPA/Panache entities (User, Game, Registration, Deck, DeckFormatValidity,
                  ChatMessage, ChatMessageReaction, Preferences)
services/       Business logic (GameService, ChatService, LobbyChatBroadcaster, CardRegistry,
                  CardSearchService, DeckImportService, DeckValidatorService, DeckValidatorFactory,
                  NameService)
dto/            Request/response DTOs (GameDto, GameDetailDto, RegistrationDto, DeckDto,
                  ChatMessageDto, CardDetailDto, UserProfileDto, ImportPreviewDto, ReactionDto,
                  ReplySnapshotDto)
enums/          Status, Role, Visibility, GameFormat, Discipline
model/          Card domain models (Card, CryptCard, LibraryCard, CryptType) and krcg/ KRCG import models
validation/     Deck validators (DeckValidator interface, BaseValidator, StandardDeckValidator,
                  DuelDeckValidator, V5DeckValidator)
config/         Application configuration beans
converters/     JPA attribute converters (ZoneIdConverter)
```

REST and WebSocket security use Quarkus form-based auth with JPA-backed user store. Roles: `USER`, `ADMIN`. WebSocket paths (`/ws/*`) require authentication.

Database is PostgreSQL with Hibernate ORM Panache. Flyway handles migrations in production; in dev mode Quarkus drops/recreates schema on startup.

### Frontend — `src/main/webui/src/`

```
app/        Router setup (React Router) — routes: /, /lobby, /decks, /game/:gameId, /login, /register
features/   Vertical slices:
              auth/   Login, register, AuthContext
              chat/   ChatPanel, ChatPanelView, MessageGroupView, MessageLineView, CardSuggestions
              deck/   DecksPage, DeckEditorPanel, DeckListPanel, DeckAnalyticsPanel, DeckImportModal,
                        DeckFilterModal, analytics/* (capacity curve, clan/discipline distribution, etc.)
              game/   GamePage, GameChatPanel
              lobby/  LobbyPage, HomePage, OpenGamesPanel, MyLobbyPanel, GlobalChatPanel,
                        CreateGameModal, GameRegistrationModal, DeckSelector, LobbySocketContext
              nav/    NavBar, NavItem, UserMenu, MobileMenu
shared/     components/  Panel, ProtectedRoute, CardToken, GameToken, ClanIcon, DisciplineIcon,
                           CostIcon, TypeIcon, PathIcon, CounterBadge, SummaryStats
            layout/      AppLayout, HeroLayout
            utils/       chatUtils, avatarUtils, parseMessageTokens
hooks/      useAuthContext, useChat, useChatInput, useWebSocket, useCardAutocomplete,
              useCardPreview, useDarkMode, useActiveRoute
stories/    Storybook stories doubling as vitest component tests
```

Built with React 19, TypeScript, Tailwind CSS 4, and Vite. The Quinoa Maven plugin bundles the frontend into the backend JAR at build time so the backend serves the SPA in production.

### Frontend ↔ Backend

- **REST**: `/games`, `/user/*`, `/decks/*`, `/cards/*` — fetched via standard `fetch` with session cookies
- **WebSockets**: `/ws/game/{gameId}` (in-game chat/events) and `/ws/lobby` (lobby-wide events) using Quarkus WebSockets Next
- **Dev proxy**: Vite proxies API/WebSocket calls to `localhost:8080` in dev mode; CORS is enabled on the backend for `localhost:5173`

### Backend Test Pattern

Tests use `@QuarkusTest` + `@TestSecurity(user="...", roles={...})` with `rest-assured` for HTTP assertions. DB state is managed with `@Transactional` setup/teardown methods.

### Card Data

Card definitions are loaded from `vtescrypt.csv` and `vteslib.csv` in `src/main/resources/` (and optionally `csv/` at the project root) via `CardRegistry` on startup. `CardSearchService` provides fuzzy search over the registry. The `names_nouns.txt`, `names_adjectives.txt`, and `names_verbs.txt` resources power the `GameToken` random-name generator. Deck format validation is handled by `DeckValidatorService` with per-format validators (`StandardDeckValidator`, `DuelDeckValidator`, `V5DeckValidator`).