package net.deckserver.jol.game.effect;

/** The game phase advanced. phase is the new phase name (matches Phase enum name). */
public record PhaseChangedEffect(String phase) implements GameEffect {}
