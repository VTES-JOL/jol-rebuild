package net.deckserver.jol.game.effect;

/** The game-level notes field was updated. */
public record GameNotesChangedEffect(String notes) implements GameEffect {}
