package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record UnlockCard(String gameId, CardRef ref) implements GameCommand {}
