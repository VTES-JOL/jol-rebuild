package net.deckserver.jol.game;

import com.fasterxml.jackson.annotation.*;
import net.deckserver.jol.enums.RegionType;

import java.util.HashMap;
import java.util.Map;

@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "name")
@JsonIdentityReference
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class PlayerData {
    private String name;
    private int pool = 30;
    private float victoryPoints = 0.0f;

    @JsonIdentityReference(alwaysAsId = true)
    private PlayerData prey;

    @JsonIdentityReference(alwaysAsId = true)
    private PlayerData predator;

    private final Map<RegionType, RegionData> regions = new HashMap<>();

    private String notes;
    private String choice;

    public PlayerData(String name) {
        this.name = name;
        for (RegionType type : RegionType.values()) {
            this.regions.put(type, new RegionData(type, this));
        }
    }

    public PlayerData() {
    }

    @JsonIgnore
    public RegionData getRegion(RegionType type) {
        return this.regions.get(type);
    }

    public void addVictoryPoints(float points) {
        this.victoryPoints += points;
    }

    public String getName() {
        return name;
    }

    @JsonIgnore
    public boolean isOusted() {
        return pool <= 0;
    }

    public int getPool() {
        return pool;
    }

    public void setPredator(PlayerData predator) {
        this.predator = predator;
    }

    public void setPrey(PlayerData prey) {
        this.prey = prey;
    }

    public void setName(String newPlayer) {
        this.name = newPlayer;
    }

    public void setPool(int pool) { this.pool = Math.max(0, pool); }
    public float getVictoryPoints() { return victoryPoints; }
    public void setVictoryPoints(float victoryPoints) { this.victoryPoints = victoryPoints; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getChoice() { return choice; }
    public void setChoice(String choice) { this.choice = choice; }
    public PlayerData getPrey() { return prey; }
    public PlayerData getPredator() { return predator; }
    public Map<RegionType, RegionData> getRegions() { return regions; }
}
