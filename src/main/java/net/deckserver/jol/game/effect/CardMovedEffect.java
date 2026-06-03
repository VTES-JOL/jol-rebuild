package net.deckserver.jol.game.effect;

/** A card changed its region (including zone transitions like hand→ready, ready→torpor, etc.). */
public record CardMovedEffect(String cardId, String targetPlayerName, String targetRegionType) implements GameEffect {}
