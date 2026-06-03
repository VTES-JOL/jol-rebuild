package net.deckserver.jol.game.effect;

/**
 * Describes a discrete state change produced by executing a GameCommand.
 * Effects are pure data — no mutable game references. They are carried in CommandResult
 * for structured logging and form the foundation for a future full CQRS/event-sourced model
 * where handlers become pure functions and mutations are applied exclusively via effects.
 */
public sealed interface GameEffect
        permits CardMovedEffect, CardLockedEffect, CardCounterChangedEffect,
                CardAttachedEffect, PlayerPoolChangedEffect, PlayerOustedEffect,
                EdgeChangedEffect, PhaseChangedEffect, TurnChangedEffect,
                ImpulseWindowChangedEffect, PendingActionChangedEffect,
                SequencingWindowChangedEffect, GameNotesChangedEffect,
                GameModeChangedEffect, GameCompletedEffect {
}
