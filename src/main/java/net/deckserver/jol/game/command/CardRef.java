package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.RegionType;

/**
 * Position-based card address: playerName + regionType + position in the region's card list,
 * with optional childIndex for cards attached to a parent (-1 means the top-level card itself).
 */
@RegisterForReflection
public record CardRef(String playerName, RegionType regionType, int position, int childIndex) {

    /** Convenience factory for a top-level card (not attached to a parent). */
    public static CardRef of(String playerName, RegionType regionType, int position) {
        return new CardRef(playerName, regionType, position, -1);
    }
}
