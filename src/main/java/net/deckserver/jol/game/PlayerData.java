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

    private Map<RegionType, RegionData> regions = new HashMap<>();

    private boolean ousted = false;
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

    public boolean isOusted() {
        return ousted;
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
}
