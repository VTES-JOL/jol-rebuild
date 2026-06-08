# Tournament Rules

Describes the VTES tournament format options, table structure, and scoring.

See [JOL Implementation — Tournament Lobby](../implementation/tournament-lobby.md) for the tournament lifecycle, seating administration, and game creation logic.

---

## Deck Format Options

| Format          | Description                                                                            |
|-----------------|----------------------------------------------------------------------------------------|
| **SINGLE_DECK** | Each player submits one deck and uses it for every round of the tournament.            |
| **MULTI_DECK**  | Each player submits one deck per round, allowing different decks for different rounds. |

All decks submitted must be valid for the tournament's game format (STANDARD, DUEL, or V5).

---

## Table Structure

- Each table seats **4 or 5 players**.
- The minimum is 4 players; the maximum is 5.
- Seat positions are numbered 1–5 in seating order.

### Byes

When the number of registered players cannot be evenly divided into tables of 4 and 5, some players receive a **bye** for a round. A player with a bye does not play that round.

---

## Rounds and Finals

A tournament consists of one or more preliminary rounds, optionally followed by a final round. The number of rounds is set by the tournament administrator.

### Predator-Prey Constraints

To ensure varied play across rounds, the same predator-prey relationship (Player A directly predating Player B in seat order) should not be duplicated across rounds.

---

## Scoring

Tournament standings are determined by:

1. **Game Win (GW)** — awarded to the player with the most Victory Points at game end (see [Game Flow § Winner and Game Win](./game-flow.md#winner-and-game-win)).
2. **Victory Points (VP)** — used as the tiebreaker when players have equal Game Wins.

In the event of a timeout, surviving players each receive 0.5 VP and no GW is awarded for that game.
