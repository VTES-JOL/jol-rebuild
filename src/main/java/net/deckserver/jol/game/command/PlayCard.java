package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Play a card from HAND or RESEARCH to a target region. Non-permanent cards go to ASH_HEAP. */
@RegisterForReflection
public record PlayCard(String gameId, String cardId, String targetRegionId) implements GameCommand {}
