package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.entity.Deck;

@RegisterForReflection
public class DeckDto {
    public Long id;
    public String name;
    public String summary;
    public String comments;
    public String timestamp;

    public DeckDto(Deck deck) {
        this.id        = deck.id;
        this.name      = deck.name;
        this.summary   = deck.summary;
        this.comments  = deck.comments;
        this.timestamp = deck.timestamp.toString();
    }
}
