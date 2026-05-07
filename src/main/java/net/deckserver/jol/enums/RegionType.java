package net.deckserver.jol.enums;

import java.util.EnumSet;
import java.util.Objects;

public enum RegionType {
    READY("Ready region", true, true),
    UNCONTROLLED("Uncontrolled region", true, false),
    ASH_HEAP("Ash heap", true, true),
    HAND("Hand", true, false),
    LIBRARY("Library", false, false),
    CRYPT("Crypt", false, false),
    TORPOR("Torpor", true, true),
    REMOVED_FROM_GAME("Removed from Game", true, true),
    RESEARCH("Research Area", true, false);

    public final static EnumSet<RegionType> OWNER_VISIBLE_REGIONS = EnumSet.of(READY, UNCONTROLLED, ASH_HEAP, HAND, TORPOR, REMOVED_FROM_GAME, RESEARCH);
    public final static EnumSet<RegionType> OTHER_VISIBLE_REGIONS = EnumSet.of(READY, ASH_HEAP, TORPOR, REMOVED_FROM_GAME);
    public final static EnumSet<RegionType> OTHER_HIDDEN_REGIONS = EnumSet.complementOf(OTHER_VISIBLE_REGIONS);
    public final static EnumSet<RegionType> SIMPLE_REGIONS = EnumSet.of(ASH_HEAP, HAND, REMOVED_FROM_GAME, LIBRARY, RESEARCH);
    public final static EnumSet<RegionType> PLAYABLE_REGIONS = EnumSet.of(HAND, RESEARCH);
    public final static EnumSet<RegionType> IN_PLAY_REGIONS = EnumSet.of(READY, TORPOR);
    private final String description;
    private final boolean ownerVisibility;
    private final boolean otherVisibility;

    RegionType(String description, boolean ownerVisibility, boolean otherVisibility) {
        this.description = description;
        this.ownerVisibility = ownerVisibility;
        this.otherVisibility = otherVisibility;
    }

    public static RegionType of(String description) {
        for (RegionType regionType : RegionType.values()) {
            if (regionType.description.equals(description)) {
                return regionType;
            }
        }
        return null;
    }

    public static RegionType startsWith(String text) {
        text = text.toLowerCase();
        for (RegionType regionType : RegionType.values()) {
            if (regionType.description.toLowerCase().startsWith(text)) {
                return regionType;
            }
        }
        return null;
    }

    public String description() {
        return description;
    }

    public boolean ownerVisibility() {
        return ownerVisibility;
    }

    public boolean otherVisibility() {
        return otherVisibility;
    }

    public boolean isVisible(String owner, String viewer) {
        return Objects.equals(owner, viewer) ? ownerVisibility : otherVisibility;
    }


}
