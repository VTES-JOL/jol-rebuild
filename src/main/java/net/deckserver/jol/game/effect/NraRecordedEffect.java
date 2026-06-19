package net.deckserver.jol.game.effect;

/** Records an NRA lock for an acting minion this turn. cardId is the UUID of the acting minion. */
public record NraRecordedEffect(String cardId, String nraKey) implements GameEffect {}
