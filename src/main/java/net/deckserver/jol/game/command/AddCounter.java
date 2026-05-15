package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record AddCounter(String gameId, CardRef ref, int amount) implements GameCommand {}
