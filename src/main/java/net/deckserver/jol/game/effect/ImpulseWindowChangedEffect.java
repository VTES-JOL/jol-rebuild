package net.deckserver.jol.game.effect;

/** The impulse window was opened, updated, or closed. active reflects the new state. */
public record ImpulseWindowChangedEffect(boolean active) implements GameEffect {}
