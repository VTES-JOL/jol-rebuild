package net.deckserver.jol.game;

import com.fasterxml.jackson.annotation.*;
import net.deckserver.jol.enums.RegionType;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;

@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
@JsonIdentityReference
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class RegionData {
    @JsonIdentityReference(alwaysAsId = true)
    private LinkedList<CardData> cards = new LinkedList<>();

    @JsonIdentityReference(alwaysAsId = true)
    private PlayerData player;
    private RegionType type;
    private String id;

    public RegionData(RegionType type, PlayerData playerData) {
        this.type = type;
        this.player = playerData;
        this.id = playerData.getName() + "-" + type.description();
    }

    public RegionData() {
    }

    @JsonIgnore
    public String getOwner() {
        return player.getName();
    }

    public List<CardData> getCards() {
        return cards;
    }

    @JsonIgnore
    public CardData getFirstCard() {
        return cards.getFirst();
    }

    public void shuffle(int limit) {
        if (limit < 0) return;
        if (limit == 0) limit = cards.size();
        List<CardData> subList = cards.subList(0, Math.min(limit, cards.size()));
        Collections.shuffle(subList);
    }

    public void addCard(CardData card, boolean top) {
        addCard(card, top ? 0 : -1);
    }

    /** position=0 → front, negative → append, N≥1 → insert at index N. */
    public void addCard(CardData card, int position) {
        if (card.getParent() != null) {
            card.getParent().remove(card);
        } else if (card.getRegion() != null) {
            card.getRegion().removeCard(card);
        }
        if (position == 0) {
            cards.addFirst(card);
        } else if (position < 0 || position >= cards.size()) {
            cards.add(card);
        } else {
            cards.add(position, card);
        }
        card.setParent(null);
        card.setRegion(this);
    }

    public void removeCard(CardData card) {
        cards.remove(card);
        card.setRegion(null);
    }

    @JsonIgnore
    public CardData getCard(int i) {
        return cards.get(i);
    }

    public String getId() { return id; }
    public RegionType getType() { return type; }
    public PlayerData getPlayer() { return player; }

    public int size() {
        int size = cards.size();
        for (CardData card: cards) {
            size += card.size();
        }
        return size;
    }
}
