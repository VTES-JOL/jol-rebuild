package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Generic card move to any region. position=0 places at front, -1 appends, N≥1 inserts at index N. */
@RegisterForReflection
public record MoveCard(String gameId, String cardId, String targetRegionId, int position) implements GameCommand {}
