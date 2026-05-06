# Game Lobby

## Overview
The game lobby allows players to create and join games. Games have a format, a visibility setting, and pass through a simple lifecycle.

## Game Formats
Each format defines its own deck validation rules and player limits:

| Format   | Max Players | Deck Rules                      |
|----------|-------------|----------------------------------|
| STANDARD | 5           | Standard deck validation         |
| DUEL     | 2           | Duel deck validation             |
| V5       | 5           | V5 deck validation               |

## Visibility
- **PUBLIC** — visible to all users in the open games listing
- **PRIVATE** — only visible to the owner and invited players

## Game Lifecycle
Games are created in `OPEN` status and transition to `ACTIVE` when play begins.

- A game can only be **deleted** by its owner while it is `OPEN`
- Format can only be changed by the owner while the game is `OPEN` and **no players have registered with decks**

## Creating a Game
Any authenticated user can create a game. The following fields can be specified:
- **name** — required; must be non-blank
- **visibility** — defaults to `PUBLIC`
- **format** — defaults to `STANDARD`

## Invitations
- The game owner can invite other users to a `PRIVATE` game by username
- Invited players will see the game in their invited-games listing
- Players must be invited before they can register for a private game

## Registration
Players register for a game by submitting one of their decks. The following conditions must be met:
- The game must be in `OPEN` status
- For `PRIVATE` games, the player must have been invited by the owner
- The deck must belong to the registering player
- The deck must be marked valid for the game's format
- The game must not already be full (at capacity for its format)

Players can withdraw their registration at any time while the game remains `OPEN`.

## Open Games Listing
The open games endpoint returns:
- All `PUBLIC` games with `OPEN` status
- For authenticated users: `PRIVATE` games the user has been invited to
- For authenticated users: the user's own `PRIVATE` `OPEN` games

## Real-Time Updates
When a player registers or leaves, a lobby update is broadcast via WebSocket so connected clients reflect the change immediately.