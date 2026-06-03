package net.deckserver.jol.game.effect;

/** The sequencing window was opened, updated, or closed. active reflects the new state. */
public record SequencingWindowChangedEffect(boolean active) implements GameEffect {}
