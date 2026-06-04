package net.deckserver.jol.game.effect;

/** A card's title was changed. */
public record CardTitleChangedEffect(String cardId, String title) implements GameEffect {}
