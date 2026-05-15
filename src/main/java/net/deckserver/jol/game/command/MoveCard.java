package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.RegionType;

/** Generic card move to any region. position=0 places at front, -1 appends, N≥1 inserts at index N. */
@RegisterForReflection
public record MoveCard(String gameId, CardRef ref, String targetPlayerName, RegionType targetRegionType, int position) implements GameCommand {}
