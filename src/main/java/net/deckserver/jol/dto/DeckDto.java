package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.entity.Deck;
import net.deckserver.jol.entity.DeckFormatValidity;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RegisterForReflection
public class DeckDto {
    public String id;
    public String name;
    public String summary;
    public String comments;
    public String timestamp;
    /** Format name → valid. Absent key means not yet validated. */
    public Map<String, Boolean> formatValidity;

    /** List constructor — does NOT access the lazy formatValidity collection. */
    public DeckDto(Deck deck) {
        this.id        = deck.id;
        this.name      = deck.name;
        this.summary   = deck.summary;
        this.comments  = deck.comments;
        this.timestamp = deck.timestamp.toString();
        this.formatValidity = Map.of();
    }

    public DeckDto(Deck deck, List<DeckFormatValidity> validity) {
        this.id        = deck.id;
        this.name      = deck.name;
        this.summary   = deck.summary;
        this.comments  = deck.comments;
        this.timestamp = deck.timestamp.toString();
        this.formatValidity = validity.stream()
                .collect(Collectors.toMap(v -> v.format.name(), v -> v.valid));
    }
}
