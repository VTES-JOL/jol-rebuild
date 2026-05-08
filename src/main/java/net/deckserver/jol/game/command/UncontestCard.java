package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record UncontestCard(String gameId, String cardId) implements GameCommand {}
