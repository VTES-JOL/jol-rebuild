package net.deckserver.jol.game;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.CardType;

/** Tracks the card currently in the CARD_AS_PLAYED sequencing window. */
@RegisterForReflection
public class CardPlayState {
    private String cardId;
    private CardType playedAsType;
    private String actingPlayer;
    private boolean cancelled;

    public CardPlayState() {}

    public CardPlayState(String cardId, CardType playedAsType, String actingPlayer) {
        this.cardId = cardId;
        this.playedAsType = playedAsType;
        this.actingPlayer = actingPlayer;
        this.cancelled = false;
    }

    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }

    public CardType getPlayedAsType() { return playedAsType; }
    public void setPlayedAsType(CardType playedAsType) { this.playedAsType = playedAsType; }

    public String getActingPlayer() { return actingPlayer; }
    public void setActingPlayer(String actingPlayer) { this.actingPlayer = actingPlayer; }

    public boolean isCancelled() { return cancelled; }
    public void setCancelled(boolean cancelled) { this.cancelled = cancelled; }
}
