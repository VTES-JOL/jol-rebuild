package net.deckserver.jol.game.effect;

/** The transfer budget was explicitly set to a new value (e.g. budget consumed or phase reset). */
public record TransfersRemainingChangedEffect(int newValue) implements GameEffect {}
