package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record AddCounter(String gameId, String cardId, int amount) implements GameCommand {}
