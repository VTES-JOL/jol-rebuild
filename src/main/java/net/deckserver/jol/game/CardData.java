package net.deckserver.jol.game;

import com.fasterxml.jackson.annotation.*;
import net.deckserver.jol.enums.CardType;
import net.deckserver.jol.enums.Clan;
import net.deckserver.jol.enums.Path;
import net.deckserver.jol.enums.Sect;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
@JsonInclude(JsonInclude.Include.NON_DEFAULT)
public class CardData {

    @JsonIdentityReference(alwaysAsId = true)
    private final LinkedList<CardData> cards = new LinkedList<>();

    @JsonIdentityReference(alwaysAsId = true)
    private CardData parent;

    @JsonIdentityReference(alwaysAsId = true)
    private RegionData region;

    @JsonIdentityReference(alwaysAsId = true)
    private PlayerData owner;

    @JsonIdentityReference(alwaysAsId = true)
    private PlayerData controller;

    private String id;
    private String cardId;
    private String name;
    private boolean locked;
    private boolean contested;
    private CardType type;
    private int capacity;
    private int counters;
    private String votes;
    private String notes;
    private String title;
    private boolean advanced;
    private Clan clan;
    private Sect sect;
    private Path path;
    private boolean minion;
    private boolean playtest;
    private boolean infernal;
    private boolean unique;

    private List<String> disciplines = new ArrayList<>();

    public CardData() {
        this.id = UUID.randomUUID().toString();
    }

    public CardData(String cardId, PlayerData owner) {
        this.cardId = cardId;
        this.owner = owner;
        this.id = UUID.randomUUID().toString();
    }

    public void add(CardData card, boolean top) {
        if (card.getParent() != null) {
            // if card has a parent, remove it from that parent first
            card.getParent().remove(card);
        } else if (card.getRegion() != null) {
            // Card has no parent, remove it from the region if it exists
            card.getRegion().removeCard(card);
        }
        if (top) {
            cards.addFirst(card);
        } else {
            cards.add(card);
        }
        card.setParent(this);
        card.setRegion(this.region);
    }

    public void remove(CardData card) {
        card.setParent(null);
        card.setRegion(null);
        this.cards.remove(card);
    }

    public void addDiscipline(String discipline) {
        this.disciplines.add(discipline);
    }

    @JsonIgnore
    public List<String> getDisciplinesSorted() {
        return this.disciplines.stream().sorted().collect(Collectors.toList());
    }

    @JsonIgnore
    public String getOwnerName() {
        return this.owner.getName();
    }

    public int size() {
        int size = cards.size();
        for (CardData card : cards) {
            size += card.size();
        }
        return size;
    }

    public LinkedList<CardData> getCards() {
        return cards;
    }

    public CardData getParent() {
        return parent;
    }

    public void setParent(CardData parent) {
        this.parent = parent;
    }

    public RegionData getRegion() {
        return region;
    }

    public void setRegion(RegionData region) {
        this.region = region;
    }

    public PlayerData getOwner() {
        return owner;
    }

    public void setOwner(PlayerData owner) {
        this.owner = owner;
    }

    public PlayerData getController() {
        return controller;
    }

    public void setController(PlayerData controller) {
        this.controller = controller;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCardId() {
        return cardId;
    }

    public void setCardId(String cardId) {
        this.cardId = cardId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isLocked() {
        return locked;
    }

    public void setLocked(boolean locked) {
        this.locked = locked;
    }

    public boolean isContested() {
        return contested;
    }

    public void setContested(boolean contested) {
        this.contested = contested;
    }

    public CardType getType() {
        return type;
    }

    public void setType(CardType type) {
        this.type = type;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public int getCounters() {
        return counters;
    }

    public void setCounters(int counters) {
        this.counters = counters;
    }

    public String getVotes() {
        return votes;
    }

    public void setVotes(String votes) {
        this.votes = votes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isAdvanced() {
        return advanced;
    }

    public void setAdvanced(boolean advanced) {
        this.advanced = advanced;
    }

    public Clan getClan() {
        return clan;
    }

    public void setClan(Clan clan) {
        this.clan = clan;
    }

    public Sect getSect() {
        return sect;
    }

    public void setSect(Sect sect) {
        this.sect = sect;
    }

    public Path getPath() {
        return path;
    }

    public void setPath(Path path) {
        this.path = path;
    }

    public boolean isMinion() {
        return minion;
    }

    public void setMinion(boolean minion) {
        this.minion = minion;
    }

    public boolean isPlaytest() {
        return playtest;
    }

    public void setPlaytest(boolean playtest) {
        this.playtest = playtest;
    }

    public boolean isInfernal() {
        return infernal;
    }

    public void setInfernal(boolean infernal) {
        this.infernal = infernal;
    }

    public boolean isUnique() {
        return unique;
    }

    public void setUnique(boolean unique) {
        this.unique = unique;
    }

    public List<String> getDisciplines() {
        return disciplines;
    }

    public void setDisciplines(List<String> disciplines) {
        this.disciplines = disciplines;
    }
}
