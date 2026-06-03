package net.deckserver.jol.game.effect;

/** A card's counter (blood/life) changed by delta (positive = added, negative = removed). */
public record CardCounterChangedEffect(String cardId, int delta) implements GameEffect {}
