package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record ShuffleLibrary(String gameId) implements GameCommand {}
