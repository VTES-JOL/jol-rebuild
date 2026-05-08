package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.CardType;

import java.util.List;

@RegisterForReflection
public class CardStateDto {
    // Always present
    public String id;
    public String regionId;
    public String ownerName;
    public String parentId;
    public List<String> childCardIds;

    // Populated only when the card is in a visible region for this viewer
    public String cardId;
    public String name;
    public CardType type;
    public boolean locked;
    public boolean contested;
    public int counters;
    public String votes;
    public String notes;
    public String title;
    public boolean advanced;
    public String clan;
    public String sect;
    public String path;
    public List<String> disciplines;
    public int capacity;
    public String controllerName;
    public boolean minion;
    public boolean unique;
}
