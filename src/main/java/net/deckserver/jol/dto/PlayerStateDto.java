package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.RegionType;

import java.util.Map;

@RegisterForReflection
public class PlayerStateDto {
    public String name;
    public int pool;
    public float victoryPoints;
    public boolean ousted;
    public String prey;
    public String predator;
    public Map<RegionType, RegionStateDto> regions;
    public String notes;
    public String choice;
}
