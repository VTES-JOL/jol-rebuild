package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record ContestCard(String gameId, CardRef ref) implements GameCommand {}
