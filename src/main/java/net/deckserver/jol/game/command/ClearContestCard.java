package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record ClearContestCard(String gameId, CardRef ref) implements GameCommand {}
