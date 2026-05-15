package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record LockCard(String gameId, CardRef ref) implements GameCommand {}
