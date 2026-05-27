# JOL - Vampire: The Eternal Struggle Online

JOL is a digital representation of the **Vampire: The Eternal Struggle (VTES)** card game. It aims to accurately mimic the logic, constraints, and mechanics of the real-world game in an online environment.

## Overview

The project provides a platform for:
- **Game Play**: Online implementation of VTES mechanics and card play rules.
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

### Frontend (React)

The frontend is located in `src/main/webui/`. In dev mode, you can run it separately for Vite's HMR:
```bash
cd src/main/webui/
npm install
npm run dev
```
It will proxy API calls to the Quarkus backend.

## Documentation

For more detailed information, please refer to:
- [CLAUDE.md](CLAUDE.md): Development guidelines and quick commands.
- [Architecture Guide](docs/architecture/README.md): Detailed technical overview.
- [Logical Model](docs/logic/README.md): Documentation on game rules and implementation.
- [Improvement Roadmap](docs/architecture/improvement-roadmap.md): Planned features and enhancements.
