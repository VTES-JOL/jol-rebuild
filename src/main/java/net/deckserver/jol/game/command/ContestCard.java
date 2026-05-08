package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record ContestCard(String gameId, String cardId) implements GameCommand {}
