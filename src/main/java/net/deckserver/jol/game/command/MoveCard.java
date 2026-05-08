package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Generic card move to any region. top=true places the card at the front of the region list. */
@RegisterForReflection
public record MoveCard(String gameId, String cardId, String targetRegionId, boolean top) implements GameCommand {}
