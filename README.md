# JOL - Vampire: The Eternal Struggle Online

JOL is an online platform for **Vampire: The Eternal Struggle (VTES)**. It supports deck management, game lobbies, tabletop-style play, chat, and tournament administration while rules-enforced gameplay is being built out incrementally.

## Overview

The project provides a platform for:
- **Game Play**: A permissive tabletop simulator mode plus a growing rules-enforced mode for formal action sequencing.
- **Deck Management**: Tools for building, importing, and validating decks (Standard, Duel, and V5 formats).
- **Lobby & Social**: Game and tournament lobbies with a comprehensive chat system.
- **Card Database**: Full registry of VTES cards (Crypt and Library) with fuzzy search capabilities.

## Architecture

JOL is built as a modern web application:
- **Backend**: Java powered by [Quarkus](https://quarkus.io/).
- **Frontend**: React, TypeScript, and Tailwind CSS, integrated via [Quinoa](https://quarkus.io/extensions/io.quarkiverse.quinoa/quarkus-quinoa).
- **Persistence**: PostgreSQL with Hibernate ORM Panache.
- **Real-time**: WebSockets for game state updates and chat.

## Getting Started

### Backend (Quarkus)

Run the application in dev mode with live reload:
```bash
./mvnw quarkus:dev
```
The Dev UI will be available at `http://localhost:8080/q/dev/`.

To build the application:
```bash
./mvnw package
```

To run backend tests:
```bash
./mvnw test
```

### Frontend (React)

The frontend is located in `src/main/webui/`. In dev mode, you can run it separately for Vite's HMR:
```bash
cd src/main/webui/
npm install
npm run dev
```
It will proxy API calls to the Quarkus backend.

To check the frontend:
```bash
cd src/main/webui/
npm run build
npm run lint
```

## Documentation

For more detailed information, please refer to:
- [CLAUDE.md](CLAUDE.md): Development guidelines and quick commands.
- [Architecture Guide](docs/architecture/README.md): Detailed technical overview.
- [VTES Rules](docs/rules/README.md): Tabletop game rules any VTES player would recognise.
- [JOL Implementation](docs/implementation/README.md): Data structures, commands, and gap analysis specific to the online client.
- [Improvement Roadmap](docs/architecture/improvement-roadmap.md): Planned features and enhancements.
