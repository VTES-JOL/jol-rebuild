package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record RemoveCounter(String gameId, String cardId, int amount) implements GameCommand {}
