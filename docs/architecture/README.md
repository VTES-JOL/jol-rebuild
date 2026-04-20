## Architecture

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
hooks/      useChat, useChatInput, useWebSocket, useCardAutocomplete,
              useCardPreview, useDarkMode, useActiveRoute
stories/    Storybook stories doubling as vitest component tests
```

Built with React 19, TypeScript, Tailwind CSS 4, and Vite. The Quinoa Maven plugin bundles the frontend into the backend JAR at build time so the backend serves the SPA in production.

### Frontend ↔ Backend

- **REST**: `/games`, `/user/*`, `/decks/*`, `/cards/*` — fetched via standard `fetch` with session cookies
- **WebSockets**: `/ws/game/{gameId}` (in-game chat/events) and `/ws/lobby` (lobby-wide events) using Quarkus WebSockets Next
- **Dev proxy**: Vite proxies API/WebSocket calls to `localhost:8080` in dev mode; CORS is enabled on the backend for `localhost:5173`
