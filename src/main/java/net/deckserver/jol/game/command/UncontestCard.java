package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record UncontestCard(String gameId, CardRef ref) implements GameCommand {}
