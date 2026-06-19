# Action Restrictions — Implementation

Documents the mechanism for recording and enforcing eligibility restrictions imposed on minions during an action or combat in JOL.

There is no corresponding VTES rules document for this mechanism — restrictions appear throughout the rules as card-text effects. The general pattern is described in the rules documents for the mechanic where they apply (blocking, combat, referendums).

---

## Current Status

The restriction data model and effect pipeline are implemented. The `CANNOT_BLOCK` type is enforced in `ActionHandler`. Other `RestrictionType` values exist and can be recorded via `RestrictionAddedEffect`, but the enforcement hooks (in `CardMovementHandler`, future `CombatHandler`, etc.) are stubs pending their respective tranche implementations.

---

## Two Restriction Modes

### 1. Dynamic restrictions

Imposed during an action by a card effect (e.g. Seduction prevents a minion from blocking; Elder Impersonation cancels a block attempt and bars re-blocking).

- Recorded via `RestrictionAddedEffect` through the normal `GameEffect` pipeline.
- Stored in `PendingActionState.actionRestrictions: Map<RestrictionType, Set<CardRef>>`.
- Cleared automatically when the action ends — `PendingActionState` is nulled on `PendingActionChangedEffect(false)`.
- For combat-scoped restrictions (maneuver/press/strike), will be stored in `CombatState.combatRestrictions` (see [Combat](./combat.md)).

### 2. Passive restrictions

Derived from equipment or in-play effects that persist while the card is in play (e.g. Signet of King Saul: vampires with capacity ≥ 8 cannot block the bearer's actions).

- Not recorded as effects — checked live at eligibility time by querying game state.
- Implemented in `PassiveRestrictionChecker` (`net.deckserver.jol.services`).
- Each method returns `true` if the action is permitted, `false` if restricted.
- Currently all stub implementations (always-true); populate as specific cards are implemented.

---

## RestrictionType Enum

`net.deckserver.jol.enums.RestrictionType`

| Value                        | Used in                    | Status     |
|------------------------------|----------------------------|------------|
| `CANNOT_BLOCK`               | `PendingActionState`       | Enforced   |
| `CANNOT_REACT`               | `PendingActionState`       | Recorded only — enforcement deferred until `PlayCard` carries a `minionRef` |
| `CANNOT_PLAY_MODIFIER`       | `PendingActionState`       | Recorded only — same deferral |
| `CANNOT_VOTE`                | `PendingActionState`       | Stub       |
| `CANNOT_MANEUVER`            | Future `CombatState`       | Stub       |
| `CANNOT_PRESS`               | Future `CombatState`       | Stub       |
| `CANNOT_USE_STRIKE_HAND`     | Future `CombatState`       | Stub       |
| `CANNOT_USE_STRIKE_RANGED`   | Future `CombatState`       | Stub       |
| `CANNOT_USE_ADDITIONAL_STRIKE` | Future `CombatState`    | Stub       |

---

## RestrictionAddedEffect

`net.deckserver.jol.game.effect.RestrictionAddedEffect`

```java
public record RestrictionAddedEffect(
    RestrictionType type,
    CardRef targetRef,    // the minion being restricted
    String sourceCardId,  // card that imposed it (null in tests)
    String reason         // human-readable (e.g. "Seduction")
) implements GameEffect {}
```

`GameEffectApplicator` adds `targetRef` to `pendingAction.actionRestrictions[type]` and returns a log entry: `"<MinionName> restricted: <reason>"`. No-op if no pending action.

---

## Checking Restrictions

```java
// In ActionHandler.handleAttemptBlock — already wired
if (game.isRulesEnforced()) {
    ActionHandler.enforceNotRestricted(pending, cmd.blockerRef(),
        RestrictionType.CANNOT_BLOCK, "This minion cannot block this action");
}

// Direct check (any handler)
if (pending.isRestricted(RestrictionType.CANNOT_BLOCK, someRef)) { ... }
```

---

## Card Examples

| Card                    | Restriction type   | Mode    | Notes                                           |
|-------------------------|--------------------|---------|-------------------------------------------------|
| Seduction               | `CANNOT_BLOCK`     | Dynamic | Blocker cannot block for the duration           |
| Elder Impersonation     | `CANNOT_BLOCK`     | Dynamic | Block is cancelled; same minion cannot retry    |
| Thought's Betrayed      | Strike restriction | Dynamic | Restricts opposing vampire's strike choices     |
| Signet of King Saul     | Block restriction  | Passive | Capacity ≥ 8 cannot block bearer's actions      |

---

## PendingActionState Fields

| Field               | Type                                 | Description                                              |
|---------------------|--------------------------------------|----------------------------------------------------------|
| `actionRestrictions` | `Map<RestrictionType, Set<CardRef>>` | Dynamic restriction sets per type; auto-cleared on action end |

`isRestricted(type, ref)` returns `true` if `ref` is in the set for `type`.

---

## Future: CombatState Restrictions

When `CombatState` is built, add:

```java
private Map<RestrictionType, Set<CardRef>> combatRestrictions = new EnumMap<>(RestrictionType.class);
```

Same pattern and same `RestrictionAddedEffect` — but applied when `CombatState` is the active scope. A `CombatRestrictionAddedEffect` is not needed; the existing effect is sufficient since the applicator can write to either state object once combat is wired.
