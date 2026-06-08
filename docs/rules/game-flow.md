# VTES Game Flow

Describes how a game of VTES is structured: setup, turn phases, priority, victory conditions, and regions.

See [JOL Implementation — Game State](../implementation/game-state.md) for the in-memory state model, commands, and WebSocket protocol.

---

## Game Formats and Table Size

| Format   | Players |
|----------|---------|
| STANDARD | 2–5     |
| DUEL     | 2       |
| V5       | 2–5     |

---

## Starting State

When a game begins:

- Player seating order is randomised and fixed for the life of the game.
- The predator–prey circle is derived from seating order (circular, wrapping last → first).
- Each player starts with **30 pool**.
- The crypt is shuffled; the top **4 cards** are dealt face-down to each player's Uncontrolled region.
- The library is shuffled; the top **7 cards** are dealt to each player's hand.
- The first turn begins in the UNLOCK phase; the first player in the randomised seating order takes the first turn.

---

## Turn Structure

### Turn Order

Turns proceed in seating order. Each player completes all five phases of their turn before the next player goes. Once all remaining (non-ousted) players have completed a turn, a new round begins.

### Phase Cycle

Each player's turn cycles through five phases in order:

```
UNLOCK → MASTER → MINION → INFLUENCE → DISCARD
```

| Phase | Purpose |
|-------|---------|
| **UNLOCK** | All cards controlled by this player unlock. Automatic upkeep effects fire (edge pool bonus, contest upkeep costs). |
| **MASTER** | This player may play one master card from their hand, plus any extras gained from trifle effects. |
| **MINION** | Each ready, unlocked minion may take one action. Block attempts, stealth/intercept exchanges, referendums, and combat all occur during this phase. |
| **INFLUENCE** | This player may spend transfer tokens to move blood between their pool and uncontrolled crypt cards, and may move a fully influenced vampire into play. |
| **DISCARD** | This player draws back up to hand size (if below 7 cards) and may play one Event card or discard one card from their hand. |

---

## Influence Transfer Budget

During the INFLUENCE phase, the current player has a limited number of transfers available:

- **Round 1:** transfers equal the player's seat position (seat 1 → 1, seat 2 → 2, seat 3 → 3, seat 4+ → 4).
- **Round 2 and later:** always 4 transfers per turn.

Moving pool to an uncontrolled vampire costs 1 transfer per blood. Moving blood back from an uncontrolled vampire to pool costs 2 transfers per blood.

Additionally, a player may spend 4 transfers plus 1 pool to draw the top card from their crypt into their uncontrolled region.

---

## Impulse and Sequencing

VTES uses a structured priority system whenever multiple players may act at the same time. **Impulse** is the opportunity to play the next card or effect inside a timing window.

Impulse windows are opened by specific protocol events — action declarations, block attempts, combat steps, referendum polling — not simply by entering a phase.

### Pass Order by Context

When the acting player passes, impulse travels in a context-dependent order:

| Context | Order after acting player passes |
|---|---|
| Combat | Defending player, then other players clockwise |
| Directed action (single target) | Target player, then other players clockwise |
| Directed action (multiple targets) | Targeted players clockwise, then others clockwise |
| Undirected action | Prey, then predator, then others clockwise |

If any player plays a card or effect, the acting player regains impulse and the cycle restarts. The window closes only when all eligible players pass consecutively without anyone playing a card or effect.

---

## The Edge

The Edge is a game token held by at most one player at a time. It starts the game unowned.

- The acting player takes the Edge whenever their bleed action deals 1 or more pool damage to their prey.
- During a referendum, the Edge-holder may burn the Edge to gain 1 vote.

---

## Order of Play

Turns normally proceed in clockwise seating order (predator to prey). Certain card effects can reverse this, causing turns to proceed counterclockwise instead.

---

## Regions

Each player has nine regions. Cards move between them as the game progresses.

| Region | Description | Owner sees | Others see |
|---|---|:---:|:---:|
| **READY** | In-play minions and locations | ✓ | ✓ |
| **UNCONTROLLED** | Face-down crypt cards being influenced | ✓ | ✗ |
| **TORPOR** | Torpored vampires | ✓ | ✓ |
| **HAND** | Cards in hand | ✓ | ✗ |
| **LIBRARY** | Library deck (face-down to everyone) | ✗ | ✗ |
| **CRYPT** | Crypt deck (face-down to everyone) | ✗ | ✗ |
| **ASH_HEAP** | Discard pile | ✓ | ✓ |
| **REMOVED_FROM_GAME** | Cards removed from play entirely | ✓ | ✓ |
| **RESEARCH** | Research Area (face-down to others) | ✓ | ✗ |

Opponents can observe the blood counter amounts on a player's uncontrolled vampires (to track influence progress) without seeing which vampire is being influenced.

Newly recruited allies are temporarily placed in the uncontrolled region to show they cannot act this turn. Unlike face-down crypt cards, recruited allies are visible to all players.

---

## Victory Points and Game End

### Ousting

When a player ousts their prey (by any means):

- The ousting player receives **1 Victory Point**.
- The ousting player receives **6 pool** from the blood bank (not from the ousted player's remaining pool).

**Simultaneous oust:** If multiple players are ousted simultaneously as a result of the same action or effect, all predators whose prey was among those ousted receive 1 VP. However, a player who is themselves ousted in the same event does **not** receive the 6 pool reward (they still receive the VP if their prey was also ousted).

### Last Survivor

The last surviving player receives **1 additional Victory Point**.

### Maximum Victory Points

The maximum total Victory Points available equals the number of players at the table. In a 5-player game the maximum is 5 VP (4 from ousting each prey in sequence, 1 for surviving).

### Winner and Game Win

The player with the most Victory Points at game end is the winner, **even if they have been ousted**. The winner receives a **Game Win (GW)**.

In tournament standings, Game Wins take priority over Victory Points.

### Timeout

When a game times out without a natural conclusion, all surviving players receive **0.5 VP** each. No GW is awarded.

### Withdrawal

A player may announce withdrawal during their UNLOCK phase. If they survive through their next UNLOCK phase without transferring pool, playing cards, using retainers, blocking, or initiating combat, they receive 1 VP and leave the game without being ousted.
