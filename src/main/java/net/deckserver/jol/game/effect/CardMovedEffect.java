package net.deckserver.jol.game.effect;

/** A card changed its region (including zone transitions like hand→ready, ready→torpor, etc.).
 *  position: 0 = top, negative = append, positive = insert at index. */
public record CardMovedEffect(String cardId, String targetPlayerName, String targetRegionType, int position) implements GameEffect {
    public CardMovedEffect(String cardId, String targetPlayerName, String targetRegionType) {
        this(cardId, targetPlayerName, targetRegionType, -1);
    }
}
