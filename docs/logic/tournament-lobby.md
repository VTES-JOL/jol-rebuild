# Tournament Lobby

## Overview
Tournaments are multi-round events administered by users with the `TOURNAMENT_ADMIN` role. They progress through a defined lifecycle from setup through completion.

## Tournament Fields
| Field               | Description                                                    |
|---------------------|----------------------------------------------------------------|
| name                | Display name of the tournament                                 |
| registrationStart   | Timestamp when player registration opens                       |
| registrationEnd     | Timestamp when player registration closes                      |
| playingStart        | Timestamp when play begins                                     |
| playingEnd          | Timestamp when play ends                                       |
| format              | `SINGLE_DECK` or `MULTI_DECK` (see Registration below)        |
| gameFormat          | The game format applied to all tables (`STANDARD`, `DUEL`, `V5`) |
| numberOfRounds      | How many rounds will be played (max 3)                         |
| finalRound          | Whether a final round is included                              |
| requiresId          | Whether players must present identification                    |
| rules               | List of rule objects (`text`, optional `conditionId` reference) |
| conditions          | List of condition objects (`id`, `text`)                       |

Tournament fields can only be edited while the tournament is in `SETUP` status.

## Status Lifecycle
```
SETUP → REGISTRATION → SEATING → ACTIVE → SEEDING → FINALS → COMPLETED
```

Non-admin players can only see tournaments in: `REGISTRATION`, `SEATING`, `ACTIVE`, `SEEDING`, `FINALS`, `COMPLETED`. Tournaments in `SETUP` are not visible to players.

> **Note:** Transitions beyond `ACTIVE` (`SEEDING`, `FINALS`, `COMPLETED`) are defined in the status enum but are not yet implemented. No API endpoints exist for those transitions.

### Status Transitions (admin only)
| Transition    | From          | To           | Side Effects                                 |
|---------------|---------------|--------------|----------------------------------------------|
| **publish**   | SETUP         | REGISTRATION | None                                         |
| **unpublish** | REGISTRATION  | SETUP        | All player registrations are deleted         |
| **seat**      | REGISTRATION  | SEATING      | None                                         |
| **activate**  | SEATING       | ACTIVE       | Validates seating, creates games for tables  |

## Player Registration
Registration is only accepted while the tournament is in `REGISTRATION` status and, if set, within the `registrationStart`–`registrationEnd` window.

### Deck Submission
The number of decks a player must submit depends on the tournament format:
- **SINGLE_DECK** — 1 deck, used for every round
- **MULTI_DECK** — one deck per round (`numberOfRounds` decks total)

All submitted decks must be valid for the tournament's `gameFormat`.

Players can unregister at any time while the tournament remains in `REGISTRATION` status.

## Seating (admin only)
Seating is managed during `SEATING` status. The admin arranges all registered players into tables and byes for each round.

### Tables
- Tables are created for the duration of the tournament.  Each round the same table has the same number of seats.
- Maximum **5 players** per table
- Minimum **4 players** per table
- Seat positions are numbered 1–5
- A player cannot be seated more than once in the same round

### Byes
- A bye can be assigned per player per round as an alternative to a table seat
- A player assigned a bye for a round will not play that round
- Byes are necessary when the number of registered players cannot be evenly divided into tables of 4 and 5 (e.g., 6, 7, or 11 players)

### Extra Rounds
While in `SEATING` status, an admin can increment `numberOfRounds` by one, subject to two limits: it cannot exceed `originalNumberOfRounds + 1`, and it cannot exceed the global maximum (`maxRounds`, default 3). If the tournament was originally configured at the global maximum, no extra round is possible.

## Activation
Activation transitions the tournament from `SEATING` to `ACTIVE`. Before activation, the following hard constraints are validated:
- Every registered player must be allocated for **every** round — either seated at a table or given a bye
- Every table must have exactly **4 or 5** players per round
- No exact predator-prey relationship (player A directly predates player B in seat order) may be duplicated across rounds

If any constraint is violated, activation is rejected with a descriptive error.

On activation, a private `ACTIVE` game is created for each table, named `"NAME: Round N Table M"`. 
Players are registered to their respective games with the appropriate deck:
- **SINGLE_DECK** — the same deck is used for each game
- **MULTI_DECK** — the deck corresponding to the round index is used, in the case of a bye, then the next unused deck will be used, in order.

## Active Tournament Games
Once active, game listings are filtered by role:
- **Admins** — can see all table games across all rounds
- **Players** — can only see games where they are seated