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
| rules               | Free-text rules for the tournament                             |
| conditions          | Free-text entry conditions                                     |

Tournament fields can only be edited while the tournament is in `SETUP` status.

## Status Lifecycle
```
SETUP → REGISTRATION → SEATING → ACTIVE → SEEDING → FINALS → COMPLETED
```

Non-admin players can only see tournaments in: `REGISTRATION`, `SEATING`, `ACTIVE`, `SEEDING`, `FINALS`, `COMPLETED`. Tournaments in `SETUP` are not visible to players.

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
- Seat positions are numbered 1–5
- A player cannot be seated more than once in the same round

### Byes
- A bye can be assigned per player per round as an alternative to a table seat
- A player assigned a bye for a round will not play that round
- All available seats must be filled before accepting byes.

### Extra Rounds
While in `SEATING` status, an admin can increment `numberOfRounds` up to one higher than originally defined, to give each player an similar number of games in the tournament.

## Activation
Activation transitions the tournament from `SEATING` to `ACTIVE`. Before activation:
- Every registered player must be allocated for **every** round — either seated at a table or given a bye
- If any player is unallocated for any round, activation is rejected

On activation, a private `ACTIVE` game is created for each table, named `"NAME: Round N Table M"`. 
Players are registered to their respective games with the appropriate deck:
- **SINGLE_DECK** — the same deck is used for each game
- **MULTI_DECK** — the deck corresponding to the round index is used, in the case of a bye, then the next unused deck will be used, in order.

## Active Tournament Games
Once active, game listings are filtered by role:
- **Admins** — can see all table games across all rounds
- **Players** — can only see games where they are seated