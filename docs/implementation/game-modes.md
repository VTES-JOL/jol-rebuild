# Game Modes — Implementation

Documents the Permissive / Rules-Enforced mode setting, command availability, UI differences, and the effect architecture.

See [VTES Rules — README](../rules/README.md) for the tabletop distinction between casual and formal play that this implements.

---

## Mode Setting

JOL supports two operating modes that control which commands are available during a game.

The mode is a game-wide setting stored in `GameData.rulesEnforced` (default: `false`). Any non-spectator player can toggle it via the **Permissive / Enforced** toggle in the game status bar. The toggle sends a `SET_RULES_MODE` command. Future work: restrict toggling to judge/admin roles once the role system is implemented.

---

## Permissive Mode (default)

Free-form tabletop simulator. Players can directly manipulate any game state — moving cards, adjusting pool, advancing phases — without the engine enforcing VTES protocol rules. This is the primary mode while full rules implementation is in progress.

**Use when:** learning the tool, playing casually, or when rules enforcement for a given mechanic is not yet implemented.

---

## Rules-Enforced Mode

Protocol-driven play. Players use higher-level commands that enforce VTES rules (phase gates, action sequencing, impulse priority). Raw state manipulation is blocked.

**Use when:** playing a fully refereed or tournament-style game where the engine should enforce correct play order.

---

## Command Mode Availability

| Command                                    | Permissive | Enforced | Notes                                                          |
|--------------------------------------------|:----------:|:--------:|----------------------------------------------------------------|
| **Phase / Turn**                           |            |          |                                                                |
| `ADVANCE_PHASE`                            |     ✓      |    —     | Direct phase skip; not available in protocol-driven play       |
| `NEXT_TURN`                                |     ✓      |    —     | Direct turn advance                                            |
| **Card Movement**                          |            |          |                                                                |
| `MOVE_CARD`                                |     ✓      |    —     | Arbitrary region-to-region move                                |
| `DRAW_CARD`                                |     ✓      |    —     |                                                                |
| `DRAW_CRYPT`                               |     ✓      |    —     |                                                                |
| `DRAW_CRYPT_TO_UNCONTROLLED`               |     ✓      |    —     | Costs 4 transfers + 1 pool; rules checked                      |
| `DISCARD_CARD`                             |     ✓      |    —     |                                                                |
| `PLAY_CARD`                                |     ✓      |    —     |                                                                |
| `ATTACH_CARD`                              |     ✓      |    —     |                                                                |
| `MOVE_TO_TORPOR`                           |     ✓      |    —     | Direct; use action protocol in enforced mode                   |
| `RESCUE_FROM_TORPOR`                       |     ✓      |    —     | Direct                                                         |
| `MOVE_TO_CRYPT`                            |     ✓      |    —     | Direct return to crypt                                         |
| `BURN_MINION`                              |     ✓      |    —     | Direct burn                                                    |
| `MERGE_ADVANCED`                           |     ✓      |    —     | Rules checked (name match, one must be advanced)               |
| **Economy**                                |            |          |                                                                |
| `SET_POOL`                                 |     ✓      |    —     | Judge-style direct pool set                                    |
| `GAIN_EDGE`                                |     ✓      |    —     |                                                                |
| `TRANSFER_BLOOD`                           |     ✓      |    —     | Rules checked for UNCONTROLLED (phase + budget)                |
| `INFLUENCE_CARD`                           |     ✓      |    —     | Rules checked (capacity, phase, current player)                |
| `OUST_PLAYER`                              |     ✓      |    —     | Direct oust                                                    |
| **Impulse / Priority**                     |            |          |                                                                |
| `OPEN_IMPULSE_WINDOW`                      |     —      |    ✓     | Manual impulse window; part of action protocol                 |
| `CLOSE_IMPULSE_WINDOW`                     |     —      |    ✓     |                                                                |
| `PASS_IMPULSE`                             |     —      |    ✓     |                                                                |
| `CLAIM_IMPULSE`                            |     —      |    ✓     |                                                                |
| **Action Protocol**                        |            |          |                                                                |
| `DECLARE_ACTION`                           |     —      |    ✓     | Rules checked: MINION phase, current player, minion not locked |
| `ATTEMPT_BLOCK`                            |     —      |    ✓     | Rules checked: minion not locked, not acting player            |
| `RESOLVE_ACTION`                           |     —      |    ✓     | Requires impulse window closed                                 |
| `ABORT_ACTION`                             |     —      |    ✓     |                                                                |
| `PASS_SEQUENCING`                          |     —      |    ✓     |                                                                |
| `CLOSE_SEQUENCING_WINDOW`                  |     —      |    ✓     |                                                                |
| **Universal (both modes)**                 |            |          |                                                                |
| `LOCK_CARD` / `UNLOCK_CARD` / `UNLOCK_ALL` |     ✓      |    ✓     |                                                                |
| `ADD_COUNTER` / `REMOVE_COUNTER`           |     ✓      |    ✓     |                                                                |
| `SET_CARD_NOTES`                           |     ✓      |    ✓     |                                                                |
| `SET_TITLE`                                |     ✓      |    ✓     |                                                                |
| `CONTEST_CARD` / `CLEAR_CONTEST_CARD`      |     ✓      |    ✓     |                                                                |
| `SET_CHOICE`                               |     ✓      |    ✓     |                                                                |
| `SET_GAME_NOTES`                           |     ✓      |    ✓     |                                                                |
| `REVERSE_ORDER`                            |     ✓      |    ✓     |                                                                |
| `SHUFFLE_LIBRARY` / `SHUFFLE_CRYPT`        |     ✓      |    ✓     |                                                                |
| `SET_RULES_MODE`                           |     ✓      |    ✓     | Mode toggle; always available                                  |

---

## UI Differences by Mode

### Status Bar Action Buttons

- **Permissive**: Draw, Draw Crypt, Shuffle Library, Shuffle Crypt, Unlock All, Gain Edge, Oust Player. No Impulse controls shown.
- **Enforced**: Shuffle Library, Shuffle Crypt. Phase tracker replaced by phase label (no advance button). Impulse, ImpulsePanel, ActionDeclarationPanel, and SequencingPanel controls shown.

### Card Context Menu

- **Permissive**: All card actions shown (Play, Discard, Move to Torpor, Rescue, Burn, Influence, Return to Crypt, blood transfer).
- **Enforced**: Raw manipulation hidden. Available: Lock/Unlock, Blood counters (display/adjust), Contest, Set Title, Set Notes.

---

## Architecture: Command → Effect

Commands are dispatched by `GameCommandService` and produce `CommandResult`, which carries:
- `logMessage` — human-readable log string
- `commandLog` — structured `CommandLogData` for the command log panel
- `effects` — list of `GameEffect` records describing what state changed

`GameEffect` is a sealed interface in `net.deckserver.jol.game.effect` with concrete records:
`CardMovedEffect`, `CardLockedEffect`, `CardCounterChangedEffect`, `CardAttachedEffect`,
`CardContestedEffect`, `CardTitleChangedEffect`, `PlayerPoolChangedEffect`, `PlayerOustedEffect`,
`PlayerVictoryPointsChangedEffect`, `EdgeChangedEffect`, `PhaseChangedEffect`, `TurnChangedEffect`,
`TransfersRemainingChangedEffect`, `ImpulseWindowChangedEffect`, `PendingActionChangedEffect`,
`SequencingWindowChangedEffect`, `GameNotesChangedEffect`, `GameModeChangedEffect`,
`GameCompletedEffect`, `OrderOfPlayReversedEffect`.

Handlers are pure functions: they validate, read state, and return `CommandResult` carrying a `List<GameEffect>` — no direct mutations. `GameEffectApplicator` is the sole mutation path; it applies each effect and returns a human-readable change-log string broadcast to all clients.

See [Mechanics Gaps](./mechanics-gaps.md) for which enforced-mode commands are fully rules-aware vs partially implemented.
