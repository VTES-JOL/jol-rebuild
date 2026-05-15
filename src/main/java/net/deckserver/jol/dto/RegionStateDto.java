package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.RegionType;

import java.util.List;

@RegisterForReflection
public class RegionStateDto {
    public String id;
    public RegionType type;
    public int count;
    public boolean visible;
    /** Card IDs — empty list when region is not visible to this viewer. */
    public List<String> cardIds;
    /**
     * Positional slot data for hidden regions where state is still partially observable
     * (e.g. UNCONTROLLED: opponents can see blood counter amounts without knowing card identity).
     * Null when not applicable.
     */
    public List<CardSlotDto> slots;
}
