package net.deckserver.jol.game.effect;

/** The game mode was switched between permissive and rules-enforced. */
public record GameModeChangedEffect(boolean rulesEnforced) implements GameEffect {}
