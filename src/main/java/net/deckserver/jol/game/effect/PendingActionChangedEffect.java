package net.deckserver.jol.game.effect;

/** The pending action state was created, updated, or cleared. active reflects whether an action is now in progress. */
public record PendingActionChangedEffect(boolean active) implements GameEffect {}
