package net.deckserver.jol.game.effect;

/**
 * Describes a discrete state change produced by executing a GameCommand.
 * Effects are pure data — no mutable game references. They are the single mechanism
 * for mutating GameData: handlers produce effects, GameEffectApplicator applies them.
 * Effects are also carried in CommandResult to produce structured change-log entries.
 */
public sealed interface GameEffect
        permits CardMovedEffect, CardLockedEffect, CardCounterChangedEffect,
                CardAttachedEffect, CardContestedEffect, CardTitleChangedEffect,
                PlayerPoolChangedEffect, PlayerOustedEffect, PlayerVictoryPointsChangedEffect,
                EdgeChangedEffect, PhaseChangedEffect, TurnChangedEffect,
                TransfersRemainingChangedEffect,
                ImpulseWindowChangedEffect, PendingActionChangedEffect,
                SequencingWindowChangedEffect, GameNotesChangedEffect,
                GameModeChangedEffect, GameCompletedEffect, OrderOfPlayReversedEffect {
}
