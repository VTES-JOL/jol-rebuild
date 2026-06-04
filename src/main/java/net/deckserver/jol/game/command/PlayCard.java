package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.RegionType;

/** Play a card from HAND or RESEARCH to a target region. Non-permanent cards go to ASH_HEAP. */
@RegisterForReflection
public record PlayCard(String gameId, CardRef ref, String targetPlayerName, RegionType targetRegionType) implements GameCommand {
    @Override public boolean isPermissiveOnly() { return true; }
}
