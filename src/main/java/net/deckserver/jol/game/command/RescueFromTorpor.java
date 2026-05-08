package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record RescueFromTorpor(String gameId, String cardId) implements GameCommand {}
