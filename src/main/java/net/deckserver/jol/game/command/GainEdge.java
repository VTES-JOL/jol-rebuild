package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record GainEdge(String gameId, String playerName) implements GameCommand {}
