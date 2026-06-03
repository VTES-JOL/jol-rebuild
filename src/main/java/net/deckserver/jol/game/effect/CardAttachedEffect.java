package net.deckserver.jol.game.effect;

/** A card was attached as a child of another card (retainer, equipment, etc.). */
public record CardAttachedEffect(String cardId, String parentCardId) implements GameEffect {}
